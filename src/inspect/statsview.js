define(['backbone', 'interactioncoordinator'], function(Backbone, coordinator) {

  var View = Backbone.View.extend({

    initialize: function() {
      this.showing = true;
      this.render();
      this.toggle();
      $('body').append(this.$el);
      coordinator.on('keyup', this.keyup, this);
    },

    render: function() {
      var stats = new Stats();
      stats.setMode(0);
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.left = '0px';
      stats.domElement.style.bottom = '0px';
      this.$el = $(stats.domElement);
      setInterval( function () {
        stats.begin();
        stats.end();
      }, 1000 / 60 );
    },

    keyup: function(event) {
      if (event.keyCode === 68) {
        this.toggle();
      }
    },

    toggle: function() {
      if (this.showing) {
        this.$el.hide();
      } else {
        this.$el.show();
      }
      this.showing = !this.showing;
    },

  });

  return View;

});
