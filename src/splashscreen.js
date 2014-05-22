define([
    'backbone',
    'jquery',
    'lib/mustache',
  ], function(Backbone, $, Mustache) {

    var Model = Backbone.Model.extend({

      initialize: function() {
        this.view = new View({model: this});
      },

      destroy: function() {
        this.view.remove();
        delete this.view;
      }

    });


    var View = Backbone.View.extend({

      id: 'dialog',
      className: 'splash',

      initialize: function() {
        this.render();
        $('#scene').append(this.$el);
      },

      render: function() {
        var template = '<h2>Welcome to Shapesmith</h3><h3>Here are some tips:</h3>' +
        '<ul>' +
          '<li>Click and drag on the grid to move and rotate.</li>' +
          '<li>Scroll to zoom.</li>' +
          '<li>Get started by using the tools at the bottom.</li>' +
          '<li>Click browser back button to undo.</li>' +
        '</ul>' +
        '<div class="button-container"><div class="button">Continue</div></div>';
        this.$el.html(Mustache.render(template, {}));

        return this;
      },

      events: {
        'click .button' : 'ok',
      },

      ok: function() {
        this.model.destroy();
      },


    });

    return Model;

  });
