define([
    'calculations',
    'selection',
    'modelviews/vertexMV',
    'modelviews/workplaneMV',
    'geometrygraphsingleton',
    'icons',
    'toolbars/toolbar',
    'asyncAPI',
  ], function(
    calc,
    selection,
    VertexMV,
    WorkplaneMV,
    geometryGraph,
    icons,
    toolbar,
    AsyncAPI) {

    var Model = toolbar.ItemModel.extend({

      initialize: function(attributes) {
        toolbar.ItemModel.prototype.initialize.call(this, attributes);
        this.set('enabled', false);
        selection.on('selected', this.selectionChanged, this);
        selection.on('deselected', this.selectionChanged, this);
      },

      selectionChanged: function(_, selection) {
        var enabled = (selection.length >= 2);
        if (this.maxNumberOfChildren !== undefined) {
          enabled = enabled && (selection.length <= this.maxNumberOfChildren);
        }
        this.set('enabled', enabled);
      },

      activate: function(savedSelection) {
        toolbar.ItemModel.prototype.activate.call(this);
        var children = savedSelection.map(function(id) {
          return geometryGraph.vertexById(id);
        });
        var boolVertex = new this.VertexConstructor({
          proto: true,
          editing: true,
          workplane: calc.copyObj(children[children.length-1].workplane),
        });
        geometryGraph.add(boolVertex, function() {
          children.forEach(function(child) {
            geometryGraph.addEdge(boolVertex, child);
          });
        });
        var result = AsyncAPI.tryCommitCreate([boolVertex]);
        if (!result.error) {
          var committedVertices = result.newVertices;
          VertexMV.eventProxy.trigger('committedCreate', [boolVertex], committedVertices);
          selection.deselectAll();
        }
      },

    });

    return Model;

  });
