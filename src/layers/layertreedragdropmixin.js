define(['geometrygraphsingleton', 'asyncAPI'], function(geometryGraph, AsyncAPI) {

  var layerTree = geometryGraph.layerTree;

  return {
    moveInto: function(node, target) {
      this.commitLayerTree(function() {
        layerTree.moveInto(node, target);
        return true;
      });
    },

    moveFirstBeforeSecond: function(node, target) {
      this.commitLayerTree(function() {
        layerTree.moveFirstBeforeSecond(node, target);
        return true;
      });
    },

    moveFirstAfterSecond: function(node, target) {
      this.commitLayerTree(function() {
        layerTree.moveFirstAfterSecond(node, target);
        return true;
      });
    },

    createOrGetGeomNode: function(id) {
      return layerTree.findGeomNodeForId(id) || layerTree.createGeometryNode(id);
    },

    commitLayerTree: function(mutator) {
      var oldLayerTreeObj = layerTree.toObj();
      if (mutator()) {
        var newLayerTreeObj = layerTree.toObj();
        AsyncAPI.commitLayerTree(oldLayerTreeObj, newLayerTreeObj);
      }
    },
  };

});
