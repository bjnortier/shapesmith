// Functions for normalizing geometry vertices to a representation
// that can be used for meshing
define([
    'calculations',
    'geometrygraphsingleton',
  ],
  function(calc, geometryGraph) {

    var normalizeTransforms = function(transforms) {
      return {
        rotation: {
          origin: {
            x: geometryGraph.evaluate(transforms.rotation.origin.x),
            y: geometryGraph.evaluate(transforms.rotation.origin.y),
            z: geometryGraph.evaluate(transforms.rotation.origin.z),
          },
          axis: {
            x: geometryGraph.evaluate(transforms.rotation.axis.x),
            y: geometryGraph.evaluate(transforms.rotation.axis.y),
            z: geometryGraph.evaluate(transforms.rotation.axis.z),
          },
          angle: geometryGraph.evaluate(transforms.rotation.angle),
        },
        translation: {
          x: geometryGraph.evaluate(transforms.translation.x),
          y: geometryGraph.evaluate(transforms.translation.y),
          z: geometryGraph.evaluate(transforms.translation.z),
        },
        scale: {
          origin: {
            x: geometryGraph.evaluate(transforms.scale.origin.x),
            y: geometryGraph.evaluate(transforms.scale.origin.y),
            z: geometryGraph.evaluate(transforms.scale.origin.z),
          },
          factor: geometryGraph.evaluate(transforms.scale.factor),
        }

      };
    };

    var normalizeWorkplane = function(workplane) {
      return {
        origin: {
          x: geometryGraph.evaluate(workplane.origin.x),
          y: geometryGraph.evaluate(workplane.origin.y),
          z: geometryGraph.evaluate(workplane.origin.z),
        },
        axis: {
          x: geometryGraph.evaluate(workplane.axis.x),
          y: geometryGraph.evaluate(workplane.axis.y),
          z: geometryGraph.evaluate(workplane.axis.z),
        },
        angle: geometryGraph.evaluate(workplane.angle),
      };
    };

    var normalizeCube = function(cube) {

      var points = geometryGraph.childrenOf(cube).filter(function(v) {
        return v.type === 'point';
      });
      var corner = calc.objToVector(
        points[0].parameters.coordinate, geometryGraph, THREE.Vector3);

      var w = geometryGraph.evaluate(cube.parameters.width);
      var d = geometryGraph.evaluate(cube.parameters.depth);
      var h = geometryGraph.evaluate(cube.parameters.height);
      var wAbs = Math.abs(w);
      var dAbs = Math.abs(d);
      var hAbs = Math.abs(h);
      var norm =  {
        x: Math.min(corner.x, corner.x + w),
        y: Math.min(corner.y, corner.y + d),
        z: Math.min(corner.z, corner.z + h),
        w: wAbs,
        d: dAbs,
        h: hAbs,
        transforms: normalizeTransforms(cube.transforms),
        workplane: normalizeWorkplane(cube.workplane),
      };
      return norm;

    };

    var normalizeSphere = function(sphere) {
      var points = geometryGraph.childrenOf(sphere);
      var center = calc.objToVector(points[0].parameters.coordinate, geometryGraph, THREE.Vector3);
      var radius = geometryGraph.evaluate(sphere.parameters.radius);

      return {
        x: center.x,
        y: center.y,
        z: center.z,
        r: radius,
        transforms: normalizeTransforms(sphere.transforms),
        workplane: normalizeWorkplane(sphere.workplane),
      };

    };

    var normalizeCylinder = function(cylinder) {
      var points = geometryGraph.childrenOf(cylinder);
      var center = calc.objToVector(points[0].parameters.coordinate, geometryGraph, THREE.Vector3);
      var radius = geometryGraph.evaluate(cylinder.parameters.radius);
      var height = geometryGraph.evaluate(cylinder.parameters.height);

      return {
        x: center.x,
        y: center.y,
        z: Math.min(center.z, center.z + height),
        r: radius,
        h: Math.abs(height),
        transforms: normalizeTransforms(cylinder.transforms),
        workplane: normalizeWorkplane(cylinder.workplane),
      };

    };

    var normalizeCone = function(cone) {
      return normalizeCylinder(cone);
    };

    var normalizeBoolean = function(boolean) {

      return {
        transforms: normalizeTransforms(boolean.transforms),
        workplane: normalizeWorkplane(boolean.workplane),
      };

    };

    var normalizeSTL = function(stlNode) {
      return {
        stl: stlNode.parameters.stl,
        transforms: normalizeTransforms(stlNode.transforms),
        workplane: normalizeWorkplane(stlNode.workplane),
      };

    };

    var normalizeVertex = function(vertex) {
      var normalized = (function() {
        switch (vertex.type) {
        case 'cube':
          return normalizeCube(vertex);
        case 'sphere':
          return normalizeSphere(vertex);
        case 'cylinder':
          return normalizeCylinder(vertex);
        case 'cone':
          return normalizeCone(vertex);
        case 'union':
        case 'subtract':
        case 'intersect':
          return normalizeBoolean(vertex);
        case 'stl':
          return normalizeSTL(vertex);
        default:
          throw new Error('no normalization defined for ' + vertex.id);
        }
      })();
      // Add the type so vertices with the same structure (e.g. cones and cylinders),
      // will not sha to the same value and give the wrong cached BSP
      normalized.type = vertex.type;
      return normalized;
    };

    return {
      normalizeVertex: normalizeVertex
    };

  });
