define(['geomnode', 'geometrygraph'], function(GeomNode, GeometryGraph) {

  describe('GeometryGraph', function() {

    beforeEach(function() {
      GeomNode.resetIDCounters();
    });

    // ---------- Cases ----------

    it('support a graph with one Point vertex', function() {
      var graph = new GeometryGraph.Graph();
      var point = graph.createPointPrototype();

      assert.equal(graph.childrenOf(point).length, 0);
    });

    it('can support a polyline with point children', function() {
      var graph = new GeometryGraph.Graph();
      var polyline = graph.createPolylinePrototype();
      assert.equal(graph.childrenOf(polyline).length, 1);

      graph.addPointToParent(polyline);
      assert.equal(graph.childrenOf(polyline).length, 2);

    });

  });

});
