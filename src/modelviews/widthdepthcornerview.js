define([
    'calculations',
    'colors',
    'scene',
    'interactioncoordinator',
    'scenevieweventgenerator',
    'worldcursor',
    'geometrygraphsingleton',
    'modelviews/geomvertexMV',
  ],
  function(
    calc,
    colors,
    sceneModel,
    coordinator,
    sceneViewEventGenerator,
    worldCursor,
    geometryGraph,
    GeomVertexMV) {

    var View = GeomVertexMV.EditingSceneView.extend({

      initialize: function(options) {
        this.vertex = options.model.vertex;
        this.origin = geometryGraph.childrenOf(this.vertex).filter(function(v) {
          return v.type === 'point';
        })[0];

        GeomVertexMV.EditingSceneView.prototype.initialize.call(this);
        this.render();
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
            this.materials.editing.face,
            this.materials.editing.wire
          ]);

        var originPosition = calc.objToVector(this.origin.parameters.coordinate, geometryGraph, THREE.Vector3);
        var cornerPosition = new THREE.Vector3().addVectors(
          originPosition,
          new THREE.Vector3(
            geometryGraph.evaluate(this.vertex.parameters.width),
            geometryGraph.evaluate(this.vertex.parameters.depth),
            0));
        this.point.position = cornerPosition;

        this.sceneObject.add(this.point);
        this.updateScaledObjects();
      },

      updateScaledObjects: function() {
        this.point.scale = this.cameraScale;
      },

      isClickable: function() {
        return false;
      },

      // This view is not draggable, but the display scene view can transfer
      // the dragging to this view (e.g. when a point is dragged), but only for
      // points that are not prototypes any more
      isDraggable: function() {
        return !this.model.vertex.proto || (this.model.parentModel && this.model.parentModel.childPointsAreDraggable);
      },

      dragStarted: function() {
        // The drag was started when the point was being edited, as
        // opposed to starting from a display node
        this.dragStartedInEditingMode = true;
      },

      drag: function(position) {
        this.dragging = true;

        var originPosition = calc.objToVector(this.origin.parameters.coordinate, geometryGraph, THREE.Vector3);
        var width = position.x - originPosition.x;
        var depth = position.y - originPosition.y;
        this.model.vertex.parameters.width = width;
        this.model.vertex.parameters.depth = depth;
        this.model.vertex.trigger('change', this.model.vertex);
      },

      dragEnded: function() {
        if (!this.dragStartedInEditingMode) {
          this.model.tryCommit();
        }
      },

    });

    // ---------- Module ----------

    return View;

  });

