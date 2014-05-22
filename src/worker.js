importScripts('/lib/require.js');

requirejs.config({
  baseUrl: ".",
  paths: {
    'underscore': '../node_modules/underscore/underscore',
    'csg': 'lib/csg',
  },
  shim: {
    'csg': {
      exports: 'CSG',
    }
  },
});
requirejs([
    'csg',
  ],
  function(CSG) {

    function translateCSG(csg, vector) {
      csg.polygons = csg.polygons.map(function(polygon) {
        return new CSG.Polygon(polygon.vertices.map(function(vertex) {
          return new CSG.Vertex(vertex.pos.plus(vector), vertex.normal);
        }));
      });
      return csg;
    }

    function scaleCSG(csg, factor) {
      csg.polygons = csg.polygons.map(function(polygon) {
        return new CSG.Polygon(polygon.vertices.map(function(vertex) {
          return new CSG.Vertex(vertex.pos.times(factor), vertex.normal);
        }));
      });
      return csg;
    }

    // https://github.com/mrdoob/three.js/blob/master/src/math/Quaternion.js
    function Quaternion(x,y,z,w) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }

    Quaternion.fromAxisAngle = function(axis, angle) {
      var halfAngle = angle / 2, s = Math.sin(halfAngle);
      return new Quaternion(
        axis.x * s,
        axis.y * s,
        axis.z * s,
        Math.cos(halfAngle));
    };

    // https://github.com/mrdoob/three.js/blob/master/src/math/Vector3.js
    function applyQuaternionToVector(vec, q) {

      var x = vec.x;
      var y = vec.y;
      var z = vec.z;

      var qx = q.x;
      var qy = q.y;
      var qz = q.z;
      var qw = q.w;

      // calculate quat * vector
      var ix =  qw * x + qy * z - qz * y;
      var iy =  qw * y + qz * x - qx * z;
      var iz =  qw * z + qx * y - qy * x;
      var iw = -qx * x - qy * y - qz * z;

      // calculate result * inverse quat
      return new CSG.Vector(
        ix * qw + iw * -qx + iy * -qz - iz * -qy,
        iy * qw + iw * -qy + iz * -qx - ix * -qz,
        iz * qw + iw * -qz + ix * -qy - iy * -qx);
    }

    function rotateCSG(csg, axis, angle) {
      var quat = Quaternion.fromAxisAngle(axis, angle);
      csg.polygons = csg.polygons.map(function(polygon) {
        return new CSG.Polygon(polygon.vertices.map(function(vertex) {
          return new CSG.Vertex(applyQuaternionToVector(vertex.pos, quat), vertex.normal);
        }));
      });
      return csg;
    }

    var returnResult = function(id, sha, csg) {
      if (!csg) {
        postMessage({error: 'no CSG for ' + id});
        return;
      }

      var jobResult = {
        id: id,
        sha: sha,
        csg: csg,
      };
      postMessage(jobResult);

    };

    var applyReverseWorkplane = function(csg, workplane) {
      if (!((workplane.origin.x === 0) && (workplane.origin.y === 0) && (workplane.origin.z === 0))) {
        csg = translateCSG(csg, new CSG.Vector(workplane.origin).negated());
      }
      if (workplane.angle !== 0) {
        csg = rotateCSG(
          csg,
          new CSG.Vector(workplane.axis),
          -workplane.angle/180*Math.PI);
      }
      return csg;
    };

    var applyTransformsAndWorkplane = function(csg, transforms, workplane) {
      if (csg) {
        if ((transforms.translation) &&
            ((transforms.translation.x !== 0) || (transforms.translation.y !== 0) || (transforms.translation.z !== 0))) {
          csg = translateCSG(csg, new CSG.Vector(transforms.translation));
        }
        if (transforms.rotation.angle !== 0) {
          csg = translateCSG(csg, new CSG.Vector(transforms.rotation.origin).negated());
          csg = rotateCSG(csg, new CSG.Vector(transforms.rotation.axis), transforms.rotation.angle/180*Math.PI);
          csg = translateCSG(csg, new CSG.Vector(transforms.rotation.origin));
        }
        if (transforms.scale.factor !== 1) {
          csg = translateCSG(csg, new CSG.Vector(transforms.scale.origin).negated());
          csg = scaleCSG(csg, transforms.scale.factor);
          csg = translateCSG(csg, new CSG.Vector(transforms.scale.origin));
        }
        if (workplane.angle !== 0) {
          csg = rotateCSG(
            csg,
            new CSG.Vector(workplane.axis),
            workplane.angle/180*Math.PI);
        }
        if (!((workplane.origin.x === 0) && (workplane.origin.y === 0) && (workplane.origin.z === 0))) {
          csg = translateCSG(csg, new CSG.Vector(workplane.origin));
        }
      }
      return csg;
    };

    // The worker message strips all the functions and the
    // result is only an object. Deserialize that back
    // into the constituent polygons.
    function deserializeRawCSG(rawObject) {
      var polygons = rawObject.polygons.map(function(rawPoly) {
        var vertices = rawPoly.vertices.map(function(rawVertex) {
          return new CSG.Vertex(
            new CSG.Vector(rawVertex.pos.x, rawVertex.pos.y, rawVertex.pos.z),
            new CSG.Vector(rawVertex.normal.x, rawVertex.normal.y, rawVertex.normal.z));
        });
        return new CSG.Polygon(vertices);
      });
      return CSG.fromPolygons(polygons);
    }

    this.addEventListener('message', function(e) {

      // Create new with the arguments
      var csg, n;
      if (e.data.sphere) {
        n = e.data.sphere;
        csg = CSG.sphere({
          center: [n.x, n.y, n.z],
          radius: n.r,
          slices: 36,
          stacks: 18,
        });
        csg = applyTransformsAndWorkplane(csg, e.data.transforms, e.data.workplane);
        returnResult(e.data.id, e.data.sha, csg);
      } else if (e.data.cylinder) {
        n = e.data.cylinder;
        csg = CSG.cylinder({
          start: [n.x, n.y, n.z],
          end: [n.x, n.y, n.z + n.h],
          radius: n.r,
          slices: 36,
        });
        csg = applyTransformsAndWorkplane(csg, e.data.transforms, e.data.workplane);
        returnResult(e.data.id, e.data.sha, csg);
      } else if (e.data.cone) {
        n = e.data.cone;
        csg = CSG.cone({
          start: [n.x, n.y, n.z],
          end: [n.x, n.y, n.z + n.h],
          radius: n.r,
          slices: 36,
        });
        csg = applyTransformsAndWorkplane(csg, e.data.transforms, e.data.workplane);
        returnResult(e.data.id, e.data.sha, csg);
      } else if (e.data.cube) {
        n = e.data.cube;
        csg = CSG.cube({
          center: [
            n.x + n.w/2,
            n.y + n.d/2,
            n.z + n.h/2,
          ],
          radius: [n.w/2, n.d/2, n.h/2],
        });
        csg = applyTransformsAndWorkplane(csg, e.data.transforms, e.data.workplane);
        returnResult(e.data.id, e.data.sha, csg);
      } else if (e.data.union || e.data.subtract || e.data.intersect) {

        // The child BSPs start off as an array of SHAs,
        // and each SHA is replaced with the BSP from the DB
        var childBSPs = e.data.union || e.data.subtract || e.data.intersect;
        csg = deserializeRawCSG(childBSPs[0]);
        for (var i = 1; i < childBSPs.length; ++i) {
          var other = deserializeRawCSG(childBSPs[i]);
          if (e.data.union) {
            csg = csg.union(other);
          } else if (e.data.subtract) {
            csg = other.subtract(csg);
          } else {
            csg = csg.intersect(other);
          }
        }
        csg = applyReverseWorkplane(csg, e.data.workplane);
        csg = applyTransformsAndWorkplane(csg, e.data.transforms, e.data.workplane);

        returnResult(e.data.id, e.data.sha, csg);

      } else if (e.data.mesh) {

        csg = deserializeRawCSG({polygons: e.data.mesh});
        csg = applyReverseWorkplane(csg, e.data.workplane);
        csg = applyTransformsAndWorkplane(csg, e.data.transforms, e.data.workplane);
        returnResult(e.data.id, e.data.sha, csg);

      } else {
        postMessage({error: 'unknown worker message:' + JSON.stringify(e.data)});
      }

    }, false);

    postMessage('initialized');
  }
);
