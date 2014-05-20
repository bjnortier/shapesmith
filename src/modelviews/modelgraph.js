// The model graph is a collection of Backbone models for the vertices
// in the graph. Each vertex in the graph has one Backbone model. Each model
// can potentially have more than one view, but typically there is one scene
// view and one or more dom tree views for each node (in the case of shared
// vertices)
define([
    'underscore',
    'backbone-events',
    'geometrygraphsingleton',
  ],
  function(
    _,
    Events,
    geometryGraph) {

    var Models = function() {

      _.extend(this, Events);

      var that = this;
      var models = {};
      var wrappers = {};

      this.addWrapper = function(type, wrapper) {
        wrappers[type] = wrapper;
      };

      geometryGraph.on('vertexAdded', function(vertex) {

        var ModelConstructor = vertex.editing ?
          wrappers[vertex.type].EditingModel :
          wrappers[vertex.type].DisplayModel;
        var model = new ModelConstructor({
          vertex: vertex,
        });
        model.postInitialize();
        model.addSceneView();
        models[vertex.id] = model;

        that.trigger('added', vertex, model);
      });

      geometryGraph.on('vertexRemoved', function(vertex) {

        if (!models[vertex.id]) {
          throw new Error('no model for ' + vertex.id);
        }
        var model = models[vertex.id];
        model.destroy();
        delete models[vertex.id];

        that.trigger('removed', vertex, model);
      });

      geometryGraph.on('vertexReplaced', function(original, replacement) {

        if (!models[original.id]) {
          throw new Error('no model for ' + original.id);
        }

        var originalModel = models[original.id];
        var ModelConstructor = replacement.editing ?
          wrappers[replacement.type].EditingModel :
          wrappers[replacement.type].DisplayModel;
        var replacementModel = new ModelConstructor({
          original: original,
          originalModel: originalModel,
          vertex: replacement,
        });
        models[replacement.id] = replacementModel;

        replacementModel.postInitialize();
        replacementModel.addSceneView();

        if (originalModel.sceneView.showStack) {
          for (var i = 0; i < originalModel.sceneView.showStack; ++i) {
            replacementModel.sceneView.pushShowStack();
          }
        }

        that.trigger('replaced', original, originalModel, replacement, replacementModel);

        // Destroy after replacement for DOM replacement
        originalModel.destroy();
      });

      this.get = function(id) {
        return models[id];
      };

      this.cancelIfEditing = function() {
        _.map(models, function(model) {
          if (model.vertex.editing) {
            model.cancel();
          }
        });
      };
    };

    return new Models();

  });
