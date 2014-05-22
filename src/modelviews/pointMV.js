define([
    'jquery',
    'lib/mustache',
    'calculations',
    'colors',
    'scene',
    'interactioncoordinator',
    'scenevieweventgenerator',
    'worldcursor',
    'geometrygraphsingleton',
    'modelviews/geomvertexMV',
    'modelviews/dimensionview',
    'asyncAPI',
  ],
  function(
    $,
    Mustache,
    calc,
    colors,
    sceneModel,
    coordinator,
    sceneViewEventGenerator,
    worldCursor,
    geometryGraph,
    GeomVertexMV,
    DimensionView,
    AsyncAPI) {

    // ---------- Editing ----------

    var EditingModel = GeomVertexMV.EditingModel.extend({

      initialize: function(options) {
        this.DOMView = EditingDOMView;
        this.SceneView = EditingSceneView;

        GeomVertexMV.EditingModel.prototype.initialize.call(this, options);
        this.views.push(new CoordinateDOMView({model: this}));
      },

      workplanePositionChanged: function(position) {
        if (this.vertex.implicit) {
          // handled by parent model
          return;
        }
        if (this.vertex.proto) {
          this.hintView.set('Click to add a point.');
          this.vertex.parameters.coordinate.x = position.x;
          this.vertex.parameters.coordinate.y = position.y;
          this.vertex.parameters.coordinate.z = position.z;
          this.vertex.trigger('change', this.vertex);
        }
      },

      // Sceneview click can be on any scene view, not just this one
      // I.e. clicks not on this point are creation clicks
      sceneViewClick: function(viewAndEvent) {
        if (this.vertex.proto && (viewAndEvent.view !== this)) {
          this.workplaneClick();
        }
      },

      workplaneClick: function() {
        if (this.vertex.implicit) {
          // handled by parent
          return;
        }
        this.tryCommit();
      },

    });

    var EditingDOMView = GeomVertexMV.EditingDOMView.extend({

      render: function() {
        GeomVertexMV.EditingDOMView.prototype.render.call(this);
        var template =
          this.beforeTemplate +
          '<div class="coordinate">' +
          '<input class="field x" type="text" value="{{x}}"></input>' +
          '<input class="field y" type="text" value="{{y}}"></input>' +
          '<input class="field z" type="text" value="{{z}}"></input>' +
          '</div>' +
          this.afterTemplate;
        var view = this.baseView;
        this.$el.html(Mustache.render(template, view));
        this.update();
        return this;
      },

      update: function() {
        var that = this;
        ['x', 'y', 'z'].forEach(function(key) {
          that.$el.find('.coordinate').find('.' + key).val(
            that.model.vertex.parameters.coordinate[key]);
        });
      },

      updateFromDOM: function() {
        ['x', 'y', 'z'].forEach(function(key) {
          var field = this.$el.find('.field.' + key);
          this.updateFromField(field, this.model.vertex.parameters.coordinate, key);
        }, this);
      }
    });

    var EditingSceneView = GeomVertexMV.EditingSceneView.extend({

      initialize: function(options) {
        GeomVertexMV.EditingSceneView.prototype.initialize.call(this, options);
        this.on('dragStarted', this.dragStarted, this);
        this.on('dragEnded', this.dragEnded, this);
        this.on('drag', this.drag, this);
      },

      remove: function() {
        GeomVertexMV.EditingSceneView.prototype.remove.call(this);
        this.off('dragStarted', this.dragStarted, this);
        this.off('dragEnded', this.dragEnded, this);
        this.off('drag', this.drag, this);
      },

      render: function() {
        GeomVertexMV.EditingSceneView.prototype.render.call(this);
        this.point = THREE.SceneUtils.createMultiMaterialObject(
          new THREE.CubeGeometry(1, 1, 1, 1, 1, 1),
          [
            this.materials.editing.origin,
            this.materials.editing.wire
          ]);
        this.point.position = calc.objToVector(
          this.model.vertex.parameters.coordinate,
          geometryGraph,
          THREE.Vector3);
        this.sceneObject.add(this.point);
        this.updateScaledObjects();
      },

      updateScaledObjects: function() {
        this.point.scale = this.cameraScale;
      },

      isClickable: function() {
        if (this.model.vertex.implicit) {
          return !this.model.vertex.active;
        } else {
          return GeomVertexMV.EditingSceneView.prototype.isClickable(this);
        }
      },

      isDraggable: function() {
        // Allow rotating when creating a new object
        return !this.model.vertex.proto;
      },

      dragStarted: function() {
        this.dragStartedInEditingMode = true;
      },

      drag: function(position) {
        this.dragging = true;
        // Do it individuallt because the z anchor view
        // refernces the coordinate or origin object, so
        // don't replace the entire object
        this.model.vertex.parameters.coordinate.x = position.x;
        this.model.vertex.parameters.coordinate.y = position.y;
        this.model.vertex.parameters.coordinate.z = position.z;
        this.model.vertex.trigger('change', this.model.vertex);
      },

      dragEnded: function() {
        if (!this.dragStartedInEditingMode) {
          this.model.tryCommit();
        }
      },

    });

    var CoordinateDOMView = DimensionView.extend({

      className: 'dimensions coordinate',

      initialize: function() {
        this.render();
        DimensionView.prototype.initialize.call(this);
      },

      render: function() {
        var template =
          '(<div class="dim x">{{x}}</div>,' +
          '<div class="dim y">{{y}}</div>,' +
          '<div class="dim z">{{z}}</div>)';
        var view =
          calc.objToVector(this.model.vertex.parameters.coordinate, geometryGraph, THREE.Vector3);
        this.$el.html(Mustache.render(template, view));
      },

      update: function() {
        this.localPosition = calc.objToVector(
          this.model.vertex.parameters.coordinate,
          geometryGraph,
          THREE.Vector3);
        DimensionView.prototype.update.call(this);
      },

    });

    // ---------- Display ----------

    var DisplayModel = GeomVertexMV.DisplayModel.extend({

      initialize: function(options) {
        this.SceneView = DisplaySceneView;
        GeomVertexMV.DisplayModel.prototype.initialize.call(this, options);
      },

    });

    var DisplaySceneView = GeomVertexMV.DisplaySceneView.extend({

      hasPriority: true,

      initialize: function() {
        GeomVertexMV.DisplaySceneView.prototype.initialize.call(this);
        this.on('dragStarted', this.dragStarted, this);
        this.on('mouseenter', this.mouseenter, this);
        this.on('mouseleave', this.mouseleave, this);
      },

      remove: function() {
        GeomVertexMV.DisplaySceneView.prototype.remove.call(this);
        this.off('dragStarted', this.dragStarted, this);
        this.on('mouseenter', this.mouseenter, this);
        this.on('mouseleave', this.mouseleave, this);
      },

      render: function() {
        GeomVertexMV.EditingSceneView.prototype.render.call(this);

        var materials;
        if (this.model.vertex.implicit && !this.highlighted) {
          materials = [this.materials.implicit.origin];
        } else {
          materials = [this.materials.normal.origin, this.materials.normal.wire];
        }
        this.point = THREE.SceneUtils.createMultiMaterialObject(
          new THREE.CubeGeometry(1, 1, 1), materials);

        this.point.scale = this.cameraScale;
        this.point.position = calc.objToVector(
          this.model.vertex.parameters.coordinate,
          geometryGraph,
          THREE.Vector3);
        this.sceneObject.add(this.point);
        this.updateScaledObjects();
      },

      updateScaledObjects: function() {
        if (this.model.inContext) {
          this.point.scale = this.cameraScale;

          if (this.selectionPoint) {
            this.hiddenSelectionObject.remove(this.selectionPoint);
          }

          var hiddenGeometry = new THREE.CubeGeometry(2, 2, 2);
          var that = this;
          hiddenGeometry.vertices = hiddenGeometry.vertices.map(function(vertex) {
            vertex.multiply(that.cameraScale);
            vertex.add(that.point.position);
            return vertex;
          });
          hiddenGeometry.computeCentroids();
          hiddenGeometry.computeFaceNormals();
          hiddenGeometry.computeBoundingSphere();
          this.selectionPoint = new THREE.Mesh(
            hiddenGeometry,
            new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide }));
          this.hiddenSelectionObject.add(this.selectionPoint);
        }
      },

      isDraggable: function() {
        return false;
      },

      isClickable: function() {
        return !this.model.vertex.implicit;
      },

      dragStarted: function() {
        AsyncAPI.edit(this.model.vertex);
        sceneViewEventGenerator.replaceInDraggable(this, this.model.vertex.id);
      },

    });


    // ---------- Module ----------

    return {
      EditingModel: EditingModel,
      DisplayModel: DisplayModel,
    };

  });

