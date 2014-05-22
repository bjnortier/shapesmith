// The overlay DOM view is a DOM view that is rendered in the scene
// over the 3D view. This view will hide/show on view rotation,
// and the deriving object should handle the re-positioning
// on camera move stop with the update() function
define([
    'backbone',
    'calculations',
    'scene',
  ],
  function(Backbone, calc, sceneModel) {

    var View = Backbone.View.extend({

      initialize: function() {
        $('#scene').append(this.$el);
        this.update();
        Backbone.View.prototype.initialize.call(this);
        this.model.vertex.on('change', this.update, this);
        sceneModel.view.on('cameraMoveStarted', this.hide, this);

        // Using the after: event since the geometry screen box is updated
        // on move stop, and use that screenbox in some overlay views
        sceneModel.view.on('after:cameraMoveStopped', this.show, this);
      },

      remove: function() {
        Backbone.View.prototype.remove.call(this);
        this.model.vertex.off('change', this.update, this);
        sceneModel.view.off('cameraMoveStarted', this.hide, this);
        sceneModel.view.off('after:cameraMoveStopped', this.show, this);
      },

      show: function() {
        this.update();
        this.$el.show();
      },

      hide: function() {
        this.$el.hide();
      },

    });

    return View;
  });
