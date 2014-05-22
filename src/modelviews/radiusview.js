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
        var cornerPosition;
        if ((this.vertex.parameters.dx !== undefined) &&
            (this.vertex.parameters.dy !== undefined)) {
          cornerPosition = new THREE.Vector3().addVectors(
            originPosition,
            new THREE.Vector3(
              this.vertex.parameters.dx,
              this.vertex.parameters.dy,
              0));
        } else {
          cornerPosition = new THREE.Vector3().addVectors(
            originPosition,
            new THREE.Vector3(
              geometryGraph.evaluate(this.vertex.parameters.radius), 0, 0));
        }
        this.point.position = cornerPosition;

        var radiusLineGeom = new THREE.Geometry();
        radiusLineGeom.vertices.push(originPosition);
        radiusLineGeom.vertices.push(cornerPosition);
        var radiusLine = new THREE.Line(radiusLineGeom, this.materials.editing.edge);

        this.sceneObject.add(this.point);
        this.sceneObject.add(radiusLine);
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
        var dx = position.x - originPosition.x;
        var dy = position.y - originPosition.y;
        var r = parseFloat(Math.sqrt(dx*dx + dy*dy).toFixed(3));
        this.model.vertex.parameters.radius = r;
        this.model.vertex.parameters.dx = dx;
        this.model.vertex.parameters.dy = dy;
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

