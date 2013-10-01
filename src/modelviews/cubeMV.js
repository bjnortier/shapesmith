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
    'modelviews/dimensionview',
    'modelviews/heightOnWidthDepthAnchorView',
    'modelviews/widthdepthcornerview',
    'asyncAPI',
    'latheapi/normalize',
    
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
    DimensionView,
    CornerEditingHeightAnchor,
    WidthDepthCornerView,
    AsyncAPI,
    Normalize) {

  // ---------- Common ----------

  var SceneViewMixin = {

    render: function() {
      GeomVertexMV.SceneView.prototype.render.call(this);

      var points = geometryGraph.childrenOf(this.model.vertex).filter(function(v) {
        return v.type === 'point'
      });
      if (points.length !== 1) {
        return;
      }

      var materials;
      if (this.model.vertex.editing) {
        materials = [
          this.materials.editing.face, 
          this.materials.editing.wire
        ]
      } else {
        materials = [
          this.materials.normal.face, 
          this.materials.normal.wire
        ]
      }

      var dimensions = Normalize.normalizeVertex(this.model.vertex);
      var position = new THREE.Vector3(dimensions.x, dimensions.y, dimensions.z);

      var cube = THREE.SceneUtils.createMultiMaterialObject(
        new THREE.CubeGeometry(dimensions.w, dimensions.d, dimensions.h),
        materials);
      cube.position = position.add(new THREE.Vector3(
        dimensions.w/2, dimensions.d/2, dimensions.h/2));
      
      var unrotatedSceneObject = new THREE.Object3D();
      unrotatedSceneObject.add(cube);
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

  }

  // ---------- Editing ----------

  var EditingModel = GeomVertexMV.EditingModel.extend({

    initialize: function(options) {
      this.DOMView = EditingDOMView;
      this.SceneView = EditingSceneView;
      GeomVertexMV.EditingModel.prototype.initialize.call(this, options);
    },

    postInitialize: function() {
      this.origin = geometryGraph.childrenOf(this.vertex).filter(function(v) {
        return v.type === 'point'
      })[0];

      // Create the child models
      var that = this;
      if (this.vertex.proto) {
        this.stage = 0;
        this.updateHint();
        this.views.push(new WidthDimensionView({model: this}));
        this.views.push(new DepthDimensionView({model: this}));
        this.views.push(new HeightDimensionView({model: this}));
      } else {

        if (this.vertex.rotating) {
          this.originalImplicitChildren = [];
          this.editingImplicitChildren = [];
        } else {
          this.originalImplicitChildren = [this.origin];
          this.origin = AsyncAPI.edit(this.origin);
          modelGraph.get(this.origin.id).parentModel = this;
          this.editingImplicitChildren = [this.origin];
        }

        if (!this.vertex.transforming) {

          this.views.push(new ZAnchorView({
            model: this, 
            vertex: this.origin,
            origin: this.origin.parameters.coordinate,
          }));

          this.views.push(new CornerEditingHeightAnchor({
            model: this, 
            heightKey: 'height',
            origin: this.origin,
            vertex: this.vertex,
          }));

          this.views.push(new WidthDepthCornerView({model: this}))
          this.views.push(new WidthDimensionView({model: this}));
          this.views.push(new DepthDimensionView({model: this}));
          this.views.push(new HeightDimensionView({model: this}));
        }
      }
      

    },

    updateRotationCenter: function() {
      var origin = {
        x: this.origin.parameters.coordinate.x,
        y: this.origin.parameters.coordinate.y,
        z: this.origin.parameters.coordinate.z,
      };
      var width = this.vertex.parameters.width;
      var depth = this.vertex.parameters.depth;
      var height = this.vertex.parameters.height;

      this.vertex.transforms.rotation.origin = {
        x: '(' + origin.x + ') + (' + width + ')/2',
        y: '(' + origin.y + ') + (' + depth + ')/2',
        z: '(' + origin.z + ') + (' + height + ')/2',
      };

    },

    translate: function(translation) {
      if (!this.startOrigin) {
        this.startOrigin = {
          x: geometryGraph.evaluate(this.origin.parameters.coordinate.x),
          y: geometryGraph.evaluate(this.origin.parameters.coordinate.y),
          z: geometryGraph.evaluate(this.origin.parameters.coordinate.z),
        }
        // this.transformRender = true; 
        this.origin.trigger('change', this.origin);
        // this.transformRender = false;
        this.startPosition = this.sceneView.sceneObject.position.clone();
      }
      this.origin.parameters.coordinate = {
        x: this.startOrigin.x + translation.x,
        y: this.startOrigin.y + translation.y,
        z: this.startOrigin.z + translation.z,
      }
      this.updateRotationCenter();

      this.origin.trigger('change', this.origin);
    },

    scale: function(origin, factor) {
      if (!this.startOrigin) {
        this.startOrigin = {
          x: geometryGraph.evaluate(this.origin.parameters.coordinate.x),
          y: geometryGraph.evaluate(this.origin.parameters.coordinate.y),
          z: geometryGraph.evaluate(this.origin.parameters.coordinate.z),
        };
        this.startWidth = geometryGraph.evaluate(this.vertex.parameters.width);
        this.startDepth = geometryGraph.evaluate(this.vertex.parameters.depth);
        this.startHeight = geometryGraph.evaluate(this.vertex.parameters.height);
        this.scaleCenter = {
          x: this.startOrigin.x + this.startWidth/2,
          y: this.startOrigin.y + this.startDepth/2,
          z: 0,
        };
      }

      this.origin.parameters.coordinate = {
        x: Math.round((this.scaleCenter.x - (this.scaleCenter.x - this.startOrigin.x)*factor)*10)/10,
        y: Math.round((this.scaleCenter.y - (this.scaleCenter.y - this.startOrigin.y)*factor)*10)/10,
        z: Math.round((this.scaleCenter.z - (this.scaleCenter.z - this.startOrigin.z)*factor)*10)/10,
      }
      this.vertex.parameters.width = this.startWidth*factor;
      this.vertex.parameters.depth = this.startDepth*factor;
      this.vertex.parameters.height = this.startHeight*factor;

      this.updateRotationCenter();
      // Origin point change event will cascade up to the cube vertex
      // so only one trigger is necessary
      this.origin.trigger('change', this.origin);
    },



    workplanePositionChanged: function(position, event) {
      if (this.vertex.proto) {
        if (this.stage === 0) {
          this.origin.parameters.coordinate.x = position.x;
          this.origin.parameters.coordinate.y = position.y;
          this.origin.parameters.coordinate.z = position.z;
          this.origin.trigger('change', this.origin);
        } else if (this.stage === 1) {  
          this.vertex.parameters.width = position.x - this.origin.parameters.coordinate.x;
          this.vertex.parameters.depth = position.y - this.origin.parameters.coordinate.y;
          this.vertex.trigger('change', this.vertex);
        } else if (this.stage === 2) {
          this.heightAnchor.drag(position, undefined, event);
        }
      }
    },

    sceneViewClick: function(viewAndEvent) {
      if (this.vertex.proto) {
        this.workplaneClick(worldCursor.lastPosition);
      }
    },

    workplaneClick: function(position) {
      if (this.vertex.proto) {
        if (this.stage === 0) {
          ++this.stage;

          this.widthDepthCornerView = new WidthDepthCornerView({
            model: this, 
          });
          this.widthDepthCornerView.dragStarted();
          this.widthDepthCornerView.isDraggable = function() {
            return false;
          };
          this.views.push(this.widthDepthCornerView);

          this.updateHint();

        } else if (this.stage === 1) {
          ++this.stage;

          this.heightAnchor = new CornerEditingHeightAnchor({
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
          delete this.activePoint;
          this.updateHint();

        } else if (this.stage === 2) {
          this.tryCommit();
        }
      } else {
        this.tryCommit();
      }
    },

    addPoint: function(position) {
      var point = geometryGraph.addPointToParent(this.vertex);
      this.activePoint = point;
      this.activePoint.active = true;
      this.workplanePositionChanged(position);
    },

    updateHint: function() {
      if (this.vertex.proto) {
        switch(this.stage) {
          case 0: 
            this.hintView.set('Click to add a corner.');
            break;
          case 1:
            this.hintView.set('Click to add a corner diagonally opposite.');
            break;
          case 2:
            this.hintView.set('Click to set the height.');
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
        '<div>width  <input class="field width" type="text" value="{{width}}"></input></div>' +
        '<div>depth  <input class="field depth" type="text" value="{{depth}}"></input></div>' +
        '<div>height <input class="field height" type="text" value="{{height}}"></input></div>' +
        this.afterTemplate;
        
      var translate = this.model.vertex.transforms.translate || {x:0, y:0, z:0};
      var view = _.extend(this.baseView, {
        width  : this.model.vertex.parameters.width,
        depth  : this.model.vertex.parameters.depth,
        height : this.model.vertex.parameters.height,
      });
      this.$el.html(Mustache.render(template, view));
      return this;
    },

    update: function() {
      GeomVertexMV.EditingDOMView.prototype.update.call(this);
      ['width', 'depth', 'height'].forEach(function(key) {
        this.$el.find('.field.' + key).val(this.model.vertex.parameters[key]);
      }, this);
    },

    updateFromDOM: function() {
      GeomVertexMV.EditingDOMView.prototype.updateFromDOM.call(this);
      ['width', 'depth', 'height'].forEach(function(key) {
        try {
          var expression = this.$el.find('.field.' + key).val();
          this.model.vertex.parameters[key] = expression;
        } catch(e) {
          console.error(e);
        }
      }, this);
      this.model.vertex.trigger('change', this.model.vertex);
    }

  }); 

  var WidthDimensionView = DimensionView.extend({

    className: 'dimensions',

    render: function() {
      var template = '<div class="dim x">{{width}}</div>';
      var view = {width: this.model.vertex.parameters.width || ''};
      this.$el.html(Mustache.render(template, view));
    },

    update: function() {
      this.localPosition = calc.objToVector(
        this.model.origin.parameters.coordinate,  
        geometryGraph, 
        THREE.Vector3);
      this.localPosition.x += geometryGraph.evaluate(this.model.vertex.parameters.width)/2;
      DimensionView.prototype.update.call(this);
    },

  });

  var DepthDimensionView = DimensionView.extend({

    className: 'dimensions',

    render: function() {
      var template = '<div class="dim y">{{depth}}</div>';
      var view = {depth: this.model.vertex.parameters.depth || ''};
      this.$el.html(Mustache.render(template, view));
    },

    update: function() {
      this.localPosition = calc.objToVector(
        this.model.origin.parameters.coordinate,  
        geometryGraph, 
        THREE.Vector3);
      this.localPosition.y += geometryGraph.evaluate(this.model.vertex.parameters.depth)/2;
      DimensionView.prototype.update.call(this);
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
      this.localPosition.x += geometryGraph.evaluate(this.model.vertex.parameters.width);
      this.localPosition.y += geometryGraph.evaluate(this.model.vertex.parameters.depth);
      this.localPosition.z += geometryGraph.evaluate(this.model.vertex.parameters.height)/2;
      DimensionView.prototype.update.call(this);
    },

  });

  var EditingSceneView = GeomVertexMV.EditingSceneView.extend({

    render: function() {
      SceneViewMixin.render.call(this);
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

  })

  // ---------- Module ----------

  return {
    EditingModel: EditingModel,
    DisplayModel: DisplayModel,
  }

});