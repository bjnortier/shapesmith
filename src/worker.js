importScripts('/lib/require.js');

requirejs.config({
  baseUrl: ".",
  paths: {
    'underscore': '../node_modules/underscore/underscore',
    'backbone-events': '../node_modules/backbone-events/lib/backbone-events',
    'backbone': '../node_modules/backbone/backbone',
    'lathe': '../node_modules/lathe/lib',
    'gl-matrix': '../node_modules/lathe/node_modules/gl-matrix/dist/gl-matrix',
    'csg': 'lib/csg',
  },
  shim: {
    'underscore': {
      exports: '_'
    },
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    'csg': {
      exports: 'CSG',
    }
  },
});
requirejs([
    'csg',
    'lathe/bsp',
    'lathe/primitives/cube',
    'lathe/primitives/sphere',
    'lathe/primitives/cylinder',
    'lathe/primitives/cone',
    'lathe/primitives/union3d',
    'lathe/primitives/subtract3d',
    'lathe/primitives/intersect3d',
    'lathe/conv',
  ],
  function(
    CSG,
    BSP,
    Cube,
    Sphere,
    Cylinder,
    Cone,
    Union3D,
    Subtract3D,
    Intersect3D,
    Conv) {

    var returnResult = function(id, sha, bsp, csg) {
      if (!bsp && !csg) {
        postMessage({error: 'no BSP/CSG for ' + id});
        return;
      }

      var brep, polygons, serialized;
      if (bsp) {
        brep = Conv.bspToBrep(bsp);
        polygons = brep.map(function(p) {
          return p.toVertices().map(function(v) {
            return v.toCoordinate();
          });
        });
        serialized = BSP.serialize(bsp);
      }
      var jobResult = {
        id: id,
        sha: sha,
        bsp: serialized,
        polygons: polygons,
        csg: csg,
      };
      postMessage(jobResult);
      
    };

    var applyReverseWorkplane = function(bsp, workplane) {
      if (!((workplane.origin.x === 0) && (workplane.origin.y === 0) && (workplane.origin.z === 0))) {  
        bsp = bsp.translate(-workplane.origin.x, -workplane.origin.y, -workplane.origin.z); 
      }
      if (workplane.angle !== 0) {
        bsp = bsp.rotate(
          workplane.axis.x, 
          workplane.axis.y, 
          workplane.axis.z, 
          -workplane.angle/180*Math.PI);
      }
      return bsp;
    };

    var applyTransformsAndWorkplane = function(bsp, transforms, workplane) {
      if (bsp) {
        if (transforms.translation) {
          bsp = bsp.translate(transforms.translation.x, transforms.translation.y, transforms.translation.z);
        }
        if (transforms.rotation.angle !== 0) {
          bsp = bsp.translate(-transforms.rotation.origin.x, -transforms.rotation.origin.y, -transforms.rotation.origin.z); 
          bsp = bsp.rotate(transforms.rotation.axis.x, transforms.rotation.axis.y, transforms.rotation.axis.z, transforms.rotation.angle/180*Math.PI);
          bsp = bsp.translate(transforms.rotation.origin.x, transforms.rotation.origin.y, transforms.rotation.origin.z); 
        }
        if (transforms.scale.factor !== 1) {
          bsp = bsp.translate(-transforms.scale.origin.x, -transforms.scale.origin.y, -transforms.scale.origin.z); 
          bsp = bsp.scale(transforms.scale.factor);
          bsp = bsp.translate(transforms.scale.origin.x, transforms.scale.origin.y, -transforms.scale.origin.z); 
        }
        if (workplane.angle !== 0) {
          bsp = bsp.rotate(
            workplane.axis.x, 
            workplane.axis.y, 
            workplane.axis.z, 
            workplane.angle/180*Math.PI);
        }
        if (!((workplane.origin.x === 0) && (workplane.origin.y === 0) && (workplane.origin.z === 0))) {
          bsp = bsp.translate(workplane.origin.x, workplane.origin.y, workplane.origin.z); 
        }
      }
      return bsp;
    };

    this.addEventListener('message', function(e) {

      // Create new with the arguments
      var bsp, csg, n;
      if (e.data.sphere) {
        n = e.data.sphere;
        csg = CSG.sphere({
          center: [n.x, n.y, n.z],
          radius: n.r,
          slices: 36,
          stacks: 18,
        });
        // bsp = applyTransformsAndWorkplane(new Sphere(e.data.sphere, 24).bsp, e.data.transforms, e.data.workplane);
        returnResult(e.data.id, e.data.sha, undefined, csg);
      } else if (e.data.cylinder) {
        n = e.data.cylinder;
        var csg = CSG.cylinder({
          start: [n.x, n.y, n.z],
          end: [n.x, n.y, n.z + n.h],
          radius: n.r,
          slices: 36,
        });
        // bsp = applyTransformsAndWorkplane(new Cylinder(e.data.cylinder, 36).bsp, e.data.transforms, e.data.workplane);
        returnResult(e.data.id, e.data.sha, undefined, csg);
      } else if (e.data.cone) {
        throw Error('not supported');
        // bsp = applyTransformsAndWorkplane(new Cone(e.data.cone, 36).bsp, e.data.transforms, e.data.workplane);
        // returnResult(e.data.id, e.data.sha, undefined, csg);
      } else if (e.data.cube) {
        n = e.data.cube;
        var csg = CSG.cube({
          center: [
            n.x + n.w/2, 
            n.y + n.d/2, 
            n.z + n.h/2,
          ],
          radius: [n.w/2, n.d/2, n.h/2],
        });
        // bsp = applyTransformsAndWorkplane(new Cube(e.data.cube).bsp, e.data.transforms, e.data.workplane);
        returnResult(e.data.id, e.data.sha, undefined, csg);
      } else if (e.data.union || e.data.subtract || e.data.intersect) {

        // The child BSPs start off as an array of SHAs, 
        // and each SHA is replaced with the BSP from the DB
        var childBSPs = e.data.union || e.data.subtract || e.data.intersect;
        
        var primitiveBsp = BSP.deserialize(childBSPs[0]);
        for (var i = 1; i < childBSPs.length; ++i) {
          var other = BSP.deserialize(childBSPs[i]);
          if (e.data.union) {
            primitiveBsp = new Union3D(primitiveBsp, other).bsp;
          } else if (e.data.subtract) {
            primitiveBsp = new Subtract3D(primitiveBsp, other).bsp;
          } else {
            primitiveBsp = new Intersect3D(primitiveBsp, other).bsp;
          }
        }
        bsp = applyReverseWorkplane(primitiveBsp, e.data.workplane);
        bsp = applyTransformsAndWorkplane(bsp, e.data.transforms, e.data.workplane);

        returnResult(e.data.id, e.data.sha, bsp);

      } else {
        postMessage({error: 'unknown worker message:' + JSON.stringify(e.data)});
      }

    }, false);

    postMessage('initialized');
  }
);