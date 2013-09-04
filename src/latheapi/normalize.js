// Functions for normalizing geometry vertices to a representation
// that can be used for meshing
define([
    'calculations',
    'geometrygraphsingleton',
  ], function(calc, geometryGraph) { 


  var normalizeCube = function(cube) {

    var points = geometryGraph.childrenOf(cube).filter(function(v) {
      return v.type === 'point'
    });
    var corner = calc.objToVector(
        points[0].parameters.coordinate, geometryGraph, THREE.Vector3);

    var w = geometryGraph.evaluate(cube.parameters.width);
    var d = geometryGraph.evaluate(cube.parameters.depth);
    var h = geometryGraph.evaluate(cube.parameters.height);
    var wAbs = Math.abs(w);
    var dAbs = Math.abs(d);
    var hAbs = Math.abs(h);
    return {
      x: Math.min(corner.x, corner.x + w),
      y: Math.min(corner.y, corner.y + d),
      z: Math.min(corner.z, corner.z + h),
      w: wAbs,
      d: dAbs,
      h: hAbs,
      transforms: cube.transforms,
      workplane: cube.workplane,
    }

  }

  var normalizeSphere = function(sphere) {
    var points = geometryGraph.childrenOf(sphere);
    var center = calc.objToVector(points[0].parameters.coordinate, geometryGraph, THREE.Vector3);
    var radius = geometryGraph.evaluate(sphere.parameters.radius);

    return {
      x: center.x, 
      y: center.y,
      z: center.z,
      r: radius,
      transforms: sphere.transforms,
      workplane: sphere.workplane,
    }
  }

  var normalizeVertex = function(vertex) {
    switch (vertex.type) {
      case 'cube':
        return normalizeCube(vertex);
      case 'sphere':
        return normalizeSphere(vertex);
      default:
        throw Error('no normalization defined for ' + vertex.id)
    }
  }

  return {
    normalizeVertex: normalizeVertex
  }

});