define([
    'underscore',
    'backbone',
    'geometrygraphsingleton',
  ],
  function(_, Backbone, geometryGraph) {

    var Manager = function() {

      _.extend(this, Backbone.Events);
      var selected = [];
      this.canSelect = false;

      this.selectOnly = function(id) {
        if (!this.canSelect || geometryGraph.isEditing()) {
          return;
        }

        var deselected = [];
        var found = false;
        for (var i in selected) {
          if (selected[i] === id) {
            found = true;
          } else {
            deselected.push(selected[i]);
          }
        }
        if (found) {
          return;
        }
        selected = [id];

        if (deselected.length > 0) {
          this.trigger('deselected', deselected, selected);
        }
        this.trigger('selected', [id], selected);

      };

      this.addToSelection = function(id) {
        if (!this.canSelect || geometryGraph.isEditing()) {
          return;
        }

        var alreadySelected = false;
        for (var i in selected) {
          if (selected[i] === id) {
            alreadySelected = true;
          }
        }

        if (alreadySelected) {
          var index = selected.indexOf(id);
          if (index !== -1) {
            selected.splice(selected.indexOf(id), 1);
            this.trigger('deselected', [id], selected);
          }
        } else  {
          selected.push(id);
          this.trigger('selected', [id], selected);
        }

      };

      this.deselectAll = function() {
        if (selected.length > 0) {
          var deselected = selected;
          selected = [];
          this.trigger('deselected', deselected, selected);
        }
      };

      this.isSelected = function(id) {
        return selected.indexOf(id) !== -1;
      };

      this.getSelected = function() {
        return selected.slice(0);
      };
    };

    return new Manager();

  });
