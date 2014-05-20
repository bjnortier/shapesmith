define([
    'jquery',
    'underscore',
    'lib/mustache',
    'calculations',
    'worldcursor',
    'scene',
    'geometrygraphsingleton',
    'modelviews/modelgraph',
    'modelviews/geomvertexMV',
    'modelviews/pointMV',
    'modelviews/zanchorview',
    'modelviews/radiusview',
    'modelviews/dimensionview',
    'modelviews/radiusheightanchor',
    'asyncAPI',
  ],
  function(
    $,
    _,
    Mustache,
    calc,
    worldCursor,
    sceneModel,
    geometryGraph,
    modelGraph,
    GeomVertexMV,
    PointMV,
    ZAnchorView,
    RadiusView,
    DimensionView,
    RadiusHeightAnchor,
    AsyncAPI) {

    // ---------- Common ----------

    var SceneViewMixin = {

      render: function() {
        GeomVertexMV.SceneView.prototype.render.call(this);

        var points = geometryGraph.childrenOf(this.model.vertex).filter(function(v) {
          return v.type === 'point';
        });
        if (points.length !== 1) {
          return;
        }

        var faceMaterial = this.model.vertex.editing ?
          this.materials.editing.face :
          this.materials.normal.face;

        var center = calc.objToVector(points[0].parameters.coordinate, geometryGraph, THREE.Vector3);
        var radius = geometryGraph.evaluate(this.model.vertex.parameters.radius);
        var height = geometryGraph.evaluate(this.model.vertex.parameters.height);

        var unrotatedSceneObject = new THREE.Object3D();

        if (radius > 0) {
          var cylinder = THREE.SceneUtils.createMultiMaterialObject(
            new THREE.CylinderGeometry(radius, radius, height, 20, 20),
            [faceMaterial]);
          cylinder.position = center.clone();
          cylinder.position.z += height/2;
          cylinder.rotation.x = Math.PI/2;
          unrotatedSceneObject.add(cylinder);
        }

        var circleGeom = new THREE.Geometry();
        for(var i = 0; i <= 50; ++i) {
          var theta = Math.PI*2*i/50;
          var dx = radius*Math.cos(theta);
          var dy = radius*Math.sin(theta);
          circleGeom.vertices.push(new THREE.Vector3(dx, dy, 0));
        }
        var bottomCircle, topCircle;
        if (this.model.vertex.editing) {
          bottomCircle = new THREE.Line(circleGeom, this.materials.editing.edge);
          topCircle = new THREE.Line(circleGeom, this.materials.editing.edge);
        } else {
          bottomCircle = new THREE.Line(circleGeom, this.materials.normal.edge);
          topCircle = new THREE.Line(circleGeom, this.materials.normal.edge);
        }
        bottomCircle.position = center.clone();
        topCircle.position = center.clone();
        topCircle.position.z += height;

        unrotatedSceneObject.add(bottomCircle);
        unrotatedSceneObject.add(topCircle);
        this.sceneObject.add(unrotatedSceneObject);

        if (this.model.vertex.rotating) {

          unrotatedSceneObject.position =
            calc.objToVector(
              this.model.vertex.transforms.rotation.origin,
              geometryGraph,
              THREE.Vector3).negate();

          var quat2 = new THREE.Quaternion();
          quat2.setFromAxisAngle(
            calc.objToVector(
              this.model.vertex.transforms.rotation.axis,
              geometryGraph,
              THREE.Vector3),
            geometryGraph.evaluate(this.model.vertex.transforms.rotation.angle)/180*Math.PI);
          var quat3 = new THREE.Quaternion().multiplyQuaternions(this.sceneObject.quaternion, quat2);

          this.sceneObject.quaternion = quat3;

          this.sceneObject.position.add(
            calc.objToVector(
              this.model.vertex.transforms.rotation.origin,
              geometryGraph,
              THREE.Vector3));

        }

      },
    };

    // ---------- Editing ----------

    var EditingModel = GeomVertexMV.EditingModel.extend({

      initialize: function(options) {
        this.DOMView = EditingDOMView;
        this.SceneView = EditingSceneView;
        GeomVertexMV.EditingModel.prototype.initialize.call(this, options);
      },

      postInitialize: function() {

        this.origin = geometryGraph.childrenOf(this.vertex).filter(function(v) {
          return v.type === 'point';
        })[0];

        // Create the child models
        if (this.vertex.proto) {
          this.stage = 'center';
          this.updateHint();
          this.activePoint = this.origin;
          this.views.push(new RadiusDimensionView({model: this}));
          this.views.push(new HeightDimensionView({model: this}));
        } else {

          this.originalImplicitChildren = geometryGraph.childrenOf(this.vertex);
          this.editingImplicitChildren = [];
          this.origin = AsyncAPI.edit(this.origin);
          modelGraph.get(this.origin.id).parentModel = this;

          this.editingImplicitChildren = [this.origin];

          if (!this.vertex.transforming) {
            this.views.push(new ZAnchorView({
              model: this,
              vertex: this.origin,
              origin: this.origin.parameters.coordinate,
            }));

            this.views.push(new RadiusHeightAnchor({
              model: this,
              heightKey: 'height',
              origin: this.origin,
              vertex: this.vertex,
            }));

            this.views.push(new RadiusView({model: this}));
            this.views.push(new RadiusDimensionView({model: this}));
            this.views.push(new HeightDimensionView({model: this}));
          }
        }

      },

      updateRotationCenter: function() {
        this.vertex.transforms.rotation.origin = {
          x: this.origin.parameters.coordinate.x,
          y: this.origin.parameters.coordinate.y,
          z: this.origin.parameters.coordinate.z,
        };
      },

      translate: function(translation) {
        if (!this.startOrigin) {
          this.startOrigin = {
            x: this.origin.parameters.coordinate.x,
            y: this.origin.parameters.coordinate.y,
            z: this.origin.parameters.coordinate.z,
          };
          this.firstTransformRender = true;
          this.origin.trigger('change', this.origin);
          this.firstTransformRender = false;
          this.startPosition = this.sceneView.sceneObject.position.clone();
        }
        this.origin.parameters.coordinate.x = this.startOrigin.x + translation.x;
        this.origin.parameters.coordinate.y = this.startOrigin.y + translation.y;
        this.origin.parameters.coordinate.z = this.startOrigin.z + translation.z;

        this.updateRotationCenter();

        this.sceneView.sceneObject.position = this.startPosition.clone().add(
          new THREE.Vector3(translation.x, translation.y, translation.z));
        this.origin.trigger('change', this.origin);
      },

      scale: function(origin, factor) {
        if (!this.startRadius) {
          this.startRadius = geometryGraph.evaluate(this.vertex.parameters.radius);
          this.startHeight = geometryGraph.evaluate(this.vertex.parameters.height);
        }
        this.vertex.parameters.radius = this.startRadius*factor;
        this.vertex.parameters.height = this.startHeight*factor;
        this.vertex.trigger('change', this.vertex);
      },

      workplanePositionChanged: function(position, event) {
        if (this.vertex.proto) {
          // Center
          if (this.stage === 'center') {
            this.activePoint.parameters.coordinate.x = position.x;
            this.activePoint.parameters.coordinate.y = position.y;
            this.activePoint.parameters.coordinate.z = position.z;
            this.activePoint.trigger('change', this.activePoint);
          // Radius
          } else if (this.stage === 'radius') {
            this.radiusView.drag(position, undefined, event);
          } else if (this.stage === 'height') {
            this.heightAnchor.drag(position, undefined, event);
          }
        }
      },

      sceneViewClick: function() {
        if (this.vertex.proto) {
          this.workplaneClick(worldCursor.lastPosition);
        }
      },

      workplaneClick: function() {
        if (this.vertex.proto) {
          if (this.stage === 'center') {
            this.stage = 'radius';

            this.radiusView = new RadiusView({
              model: this,
            });
            this.radiusView.dragStarted();
            this.radiusView.isDraggable = function() {
              return false;
            };
            this.views.push(this.radiusView);

            this.updateHint();
          } else if (this.stage === 'radius') {
            this.stage = 'height';

            this.heightAnchor = new RadiusHeightAnchor({
              model: this,
              heightKey: 'height',
              origin: this.origin,
              vertex: this.vertex,
            });
            this.heightAnchor.dragStarted();
            this.heightAnchor.isDraggable = function() {
              return false;
            };
            this.views.push(this.heightAnchor);

          } else if (this.stage === 'height') {
            this.tryCommit();
          }
        } else {
          this.tryCommit();
        }
      },

      updateHint: function() {
        if (this.vertex.proto) {
          switch(this.stage) {
          case 0:
            this.hintView.set('Click to add a corner.');
            break;
          case 1:
            this.hintView.set('Click to set the radius.');
            break;
          }
        }
      },

    });

    var EditingDOMView = GeomVertexMV.EditingDOMView.extend({

      render: function() {
        GeomVertexMV.EditingDOMView.prototype.render.call(this);
        var template =
          this.beforeTemplate +
          '<div>radius <input class="field radius" type="text" value="{{radius}}"></input></div>' +
          '<div>height <input class="field height" type="text" value="{{height}}"></input></div>' +
          this.afterTemplate;
        var view = _.extend(this.baseView, {
          radius : this.model.vertex.parameters.radius,
        });
        this.$el.html(Mustache.render(template, view));
        return this;
      },

      update: function() {
        GeomVertexMV.EditingDOMView.prototype.update.call(this);
        ['radius', 'height'].forEach(function(key) {
          this.$el.find('.field.' + key).val(
            this.model.vertex.parameters[key]);
        }, this);
      },

      updateFromDOM: function() {
        GeomVertexMV.EditingDOMView.prototype.updateFromDOM.call(this);
        ['radius', 'height'].forEach(function(key) {
          var field = this.$el.find('.field.' + key);
          this.updateFromField(field, this.model.vertex.parameters, key);
        }, this);
      }

    });

    var RadiusDimensionView = DimensionView.extend({

      className: 'dimensions',

      render: function() {
        var template = '<div class="dim xy">{{radius}}</div>';
        var view = {radius: this.model.vertex.parameters.radius || ''};
        this.$el.html(Mustache.render(template, view));
      },

      update: function() {
        this.localPosition = calc.objToVector(
          this.model.origin.parameters.coordinate,
          geometryGraph,
          THREE.Vector3);
        // Use the temporary dx and dy used on creation when available
        if ((this.model.vertex.parameters.dx !== undefined) &&
            (this.model.vertex.parameters.dy !== undefined)) {
          this.localPosition.x += geometryGraph.evaluate(this.model.vertex.parameters.dx)/2;
          this.localPosition.y += geometryGraph.evaluate(this.model.vertex.parameters.dy)/2;
        } else {
          this.localPosition.x += geometryGraph.evaluate(this.model.vertex.parameters.radius)/2;
        }
        DimensionView.prototype.update.call(this);
      },

    });

    var EditingSceneView = GeomVertexMV.EditingSceneView.extend({

      render: function() {
        SceneViewMixin.render.call(this);
      },

    });

    var HeightDimensionView = DimensionView.extend({

      className: 'dimensions',

      render: function() {
        var template = '<div class="dim z">{{height}}</div>';
        var view = {height: this.model.vertex.parameters.height || ''};
        this.$el.html(Mustache.render(template, view));
      },

      update: function() {
        this.localPosition = calc.objToVector(
          this.model.origin.parameters.coordinate,
          geometryGraph,
          THREE.Vector3);
        if ((this.model.vertex.parameters.dx !== undefined) &&
            (this.model.vertex.parameters.dy !== undefined)) {
          this.localPosition.x += geometryGraph.evaluate(this.model.vertex.parameters.dx);
          this.localPosition.y += geometryGraph.evaluate(this.model.vertex.parameters.dy);
          this.localPosition.z += geometryGraph.evaluate(this.model.vertex.parameters.height)/2;
        } else {
          this.localPosition.x += geometryGraph.evaluate(this.model.vertex.parameters.radius);
          this.localPosition.z += geometryGraph.evaluate(this.model.vertex.parameters.height)/2;
        }
        DimensionView.prototype.update.call(this);
      },

    });


    // ---------- Display ----------

    var DisplayModel = GeomVertexMV.DisplayModel.extend({

      initialize: function(options) {
        this.SceneView = DisplaySceneView;
        GeomVertexMV.DisplayModel.prototype.initialize.call(this, options);
      },

      destroy: function() {
        GeomVertexMV.DisplayModel.prototype.destroy.call(this);
      },

    });

    var DisplaySceneView = GeomVertexMV.DisplaySceneView.extend(SceneViewMixin).extend({

      render: function() {
        GeomVertexMV.DisplaySceneView.prototype.render.call(this);
        var that = this;
        this.createMesh(function(result) {
          that.renderMesh(result);
        });
      },

    });

    // ---------- Module ----------

    return {
      EditingModel: EditingModel,
      DisplayModel: DisplayModel,
    };

  });
