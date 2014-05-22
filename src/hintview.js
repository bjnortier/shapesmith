define(['backbone'], function(Backbone) {

  var View = Backbone.View.extend({

    id: 'hint',

    initialize: function() {
      this.clear();
      $('#scene').append(this.$el);
    },

    set: function(hintText) {
      this.$el.html(hintText);
      this.$el.show();
    },

    clear: function() {
      this.$el.hide();
    }
  });

  return new View();

});
