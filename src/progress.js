define([
    'backbone',
    'jquery',
  ], function(Backbone, $) {

    var Model = Backbone.Model.extend({

      initialize: function() {
        this.view = new View({model: this});
      },

      destroy: function() {
        this.view.remove();
        delete this.view;
      },

      addTrackable: function(trackable) {
        var that = this;
        trackable.on('start', function(id) {
          that.view.start(id);
        });
        trackable.on('finish', function(id) {
          that.view.finish(id);
        });
      },

    });

    var View = Backbone.View.extend({

      id: 'progress',

      initialize: function() {
        this.render();
        $('#messaging').append(this.$el);
      },

      render: function() {
        this.$el.html('');
        return this;
      },

      start: function(id) {
        this.$el.append('<img class="tracker_' + id + '" src="/images/dot.gif"/>');
      },

      finish: function(id) {
        this.$el.find('.tracker_' + id).remove();
      },

    });

    return new Model();

  });
