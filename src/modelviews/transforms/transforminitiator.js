define([
    'backbone',
    'selection',
    'scene',
    'scenevieweventgenerator',
    'geometrygraphsingleton',
    'asyncAPI',
    'modelviews/modelgraph',
    'modelviews/transforms/translatesceneview',
    'modelviews/transforms/scalesceneview',
    'modelviews/transforms/uvwrotationsceneviews',
    'calculations',
    'modelviews/currentworkplane',
  ],
  function(
    Backbone,
    selection,
    sceneModel,
    sceneViewEventGenerator,
    geometryGraph,
    AsyncAPI,
    modelGraph,
    TranslateSceneView,
    ScaleSceneView,
    UVWRotationSceneViews,
    calc,
    currentWorkplane) {

    var Model = Backbone.Model.extend({

      initialize: function() {
        this.sceneViews = [];
        selection.on('selected', this.selected, this);
        selection.on('deselected', this.deselected, this);
      },

      deselected: function() {
        this.sceneViews.forEach(function(view) {
          view.remove();
        });
        this.sceneViews = [];
      },

      selected: function(_, selected) {
        if (selected.length === 1) {
          this.vertex = geometryGraph.vertexById(selected[0]);
          this.selectedModel = modelGraph.get(selected[0]);

          this.selectedModel.sceneView.on('dragStarted', this.dragStarted, this);
          this.selectedModel.sceneView.on('dragEnded', this.dragEnded, this);
          this.selectedModel.sceneView.on('drag', this.drag, this);

          this.sceneViews = [
            new TranslateSceneView({model: this}),
            new ScaleSceneView({model: this}),
            new UVWRotationSceneViews.U({initiator: this, model: this.selectedModel, vertex: this.vertex}),
            new UVWRotationSceneViews.V({initiator: this, model: this.selectedModel, vertex: this.vertex}),
            new UVWRotationSceneViews.W({initiator: this, model: this.selectedModel, vertex: this.vertex}),
          ];
        } else {
          this.sceneViews.forEach(function(view) {
            view.remove();
          });
          this.sceneViews = [];

          if (this.selectedModel) {
            this.selectedModel.sceneView.off('dragStarted', this.dragStarted, this);
            this.selectedModel.sceneView.off('dragEnded', this.dragEnded, this);
            this.selectedModel.sceneView.off('drag', this.drag, this);
          }
          this.selectedModel = undefined;
        }
      },

      dragStarted: function() {
        this.sceneViews.forEach(function(view) {
          view.remove();
        });
        this.sceneViews = [];

        this.initialTranslation = calc.objToVector(
          this.vertex.transforms.translation,
          geometryGraph,
          THREE.Vector3);
        this.originalVertex = this.vertex;
        this.originalVertex.transforming = true;
        this.editingVertex = AsyncAPI.edit(this.vertex);
        this.editingModel = modelGraph.get(this.editingVertex.id);
      },

      drag: function(position) {
        this.sceneViews.forEach(function(view) {
          view.remove();
        });
        this.sceneViews = [];

        if (!this.initialPosition) {
          this.initialPosition = position;
        }
        var diff = new THREE.Vector3().subVectors(position, this.initialPosition);
        var grid = currentWorkplane.getGridSize();
        var translation = new THREE.Vector3(Math.round(diff.x/grid) * grid,
                                            Math.round(diff.y/grid) * grid,
                                            Math.round(diff.z/grid) * grid);

        this.editingModel.translate(translation);
      },

      dragEnded: function() {
        this.initialPosition = undefined;
        this.dragging = false;
        this.editingVertex.transforming = false;
        this.editingModel.tryCommit();
      },

      hideOtherViews: function(view) {
        this.sceneViews.forEach(function(otherView) {
          if (otherView !== view) {
            otherView.remove();
          }
        });
        this.sceneViews = [view];
      },

    });

    return new Model();

  });
