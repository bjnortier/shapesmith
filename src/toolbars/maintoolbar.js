define([
    'toolbars/toolbar',
    'toolbars/geomtoolbar',
  ],
  function(
    Toolbar,
    geometryGraph) {

    var MainToolbarModel = Toolbar.Model.extend({

      appendSelector: '#toolbar',

      initialize: function(attributes) {
        Toolbar.Model.prototype.initialize.call(this, attributes);
        geometryGraph.on('committed', this.geometryCommitted, this);
      },

      activate: function() {
      },

      setActive: function(item) {
        this.activeItem = item;
        item.activate();
      },

      deactivateActiveItem: function() {
        if (this.activeItem) {
          this.activeItem.deactivate();
        }
      },

      itemClicked: function(item) {
        this.activate(item);
      },

    });

    var toolbarModel = new MainToolbarModel({name: 'main'});
    return toolbarModel;

  });
