define([
    'underscore',
    'geomnode',
    'casgraph/sha1hasher',
    'geometrygraph',
    'mesh',
  ], function(
    _,
    GeomNode,
    sha1hasher,
    GeometryGraph,
    Mesh) {

    var loadGraph = function(serializedGraph, shasToVertices) {
      var graph = new GeometryGraph.Graph();
      graph.createFromHashSerialization(serializedGraph, shasToVertices);
      return graph;
    };

    var graphToOBJ = function() {

      var meshes = [];

      if (meshes.length === 0) {
        return new Mesh().toOBJ();
      } else if (meshes.length === 1) {
        return meshes[0].toOBJ();
      } else {
        var result = new Mesh();
        meshes.forEach(function(mesh) {
          result.mergeIn(mesh);
        });
        return result.toOBJ();
      }
    };

    var toOBJ = function(serializedGraph, shasToVertices) {
      var graph = loadGraph(serializedGraph, shasToVertices);
      return graphToOBJ(graph);
    };

    var hashObject = function(object) {
      if (object.hasOwnProperty('vertices') && object.hasOwnProperty('edges')) {
        return sha1hasher.hash(object);
      } else {
        return sha1hasher.hash(GeomNode.strip(object));
      }
    };

    return {
      loadGraph  : loadGraph,
      graphToOBJ : graphToOBJ,
      toOBJ      : toOBJ,
      hashObject : hashObject,
    };

  });
