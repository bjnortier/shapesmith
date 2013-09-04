define([
    'calculations',
    'geomnode',
    'selection',
    'modelviews/vertexMV',
    'modelviews/workplaneMV',
    'geometrygraphsingleton',
    'icons',
    'toolbars/toolbar',
    'asyncAPI',
  ], function(
    calc,
    GeomNode,
    selection,
    VertexMV,
    WorkplaneMV,
    geometryGraph,
    icons,
    toolbar,
    AsyncAPI) {

  var Model = toolbar.ItemModel.extend({
    
    name: 'subtract',

    initialize: function(attributes) {
      toolbar.ItemModel.prototype.initialize.call(this, attributes);
      this.set('enabled', false);
      selection.on('selected', this.selectionChanged, this);
      selection.on('deselected', this.selectionChanged, this);
    },

    selectionChanged: function(_, selection) {
      var polyline;
      this.set('enabled', (selection.length === 2));
    },

    activate: function(savedSelection) {
      toolbar.ItemModel.prototype.activate.call(this);
      var a = geometryGraph.vertexById(savedSelection[1]);
      var b = geometryGraph.vertexById(savedSelection[0]);

      var boolVertex = new GeomNode.Subtract({
        proto: true,
        editing: true,
        workplane: calc.copyObj(b.workplane),
      });
      geometryGraph.add(boolVertex, function() {
        geometryGraph.addEdge(boolVertex, a);
        geometryGraph.addEdge(boolVertex, b);
      });
      var result = AsyncAPI.tryCommitCreate([boolVertex]);
      if (!result.error) {
        var committedVertices = result.newVertices;
        VertexMV.eventProxy.trigger('committedCreate', [boolVertex], committedVertices);
        selection.deselectAll();
      }
    },

    icon: icons['subtract'],

  });

  return Model;

});
