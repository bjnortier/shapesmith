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

      isLocal: true,

      initialize: function(options) {
        this.vertex = options.vertex;
        this.origin = options.origin;
        this.isGlobal = options.isGlobal;

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

        this.point.position = calc.objToVector(this.origin, geometryGraph, THREE.Vector3);

        this.sceneObject.add(this.point);
        this.updateScaledObjects();
      },

      updateScaledObjects: function() {
        this.point.scale = this.cameraScale;
      },

      isClickable: function() {
        return false;
      },

      isDraggable: function() {
        return !this.dragging;
      },

      dragStarted: function() {
        this.startPosition = calc.objToVector(this.origin, geometryGraph, THREE.Vector3);
        this.dragging = true;
      },

      drag: function(position) {
        this.origin.x = this.startPosition.x + position.x;
        this.origin.y = this.startPosition.y + position.y;
        this.vertex.trigger('change', this.vertex);
      },

      dragEnded: function() {
        this.dragging = false;
      },

    });

    // ---------- Module ----------

    return View;

  });

