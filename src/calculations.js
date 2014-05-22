define([], function() {

  var copyObj = function(value) {
    if ((value === null) || (value === undefined)) {
      return undefined;
    } else if (Object.prototype.toString.call(value) === '[object Array]') {
      return value.map(function(x) {
        return copyObj(x);
      });
    } else if (typeof(value) === 'object') {
      var returnObj = {};
      for (var key in value) {
        if (value.hasOwnProperty(key)) {
          returnObj[key] = copyObj(value[key]);
        }
      }
      return returnObj;
    } else {
      return value;
    }
  };

  var mouseRayForEvent = function(sceneElement, camera, event) {
    var mouse = {
      x : (event.offsetX / sceneElement.innerWidth()) * 2 - 1,
      y : -(event.offsetY / sceneElement.innerHeight()) * 2 + 1,
    };

    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    var projector = new THREE.Projector();
    var mouse3D = projector.unprojectVector(vector, camera);
    var mouseRay = new THREE.Ray(camera.position);
    mouseRay.direction = mouse3D.sub(camera.position).normalize();
    return mouseRay;
  };

  var positionOnWorkplane = function(sceneElement, event, workplaneVertex, geometryGraph, camera) {
    var planeOrigin = new THREE.Vector3(0,0,0);
    var planeNormal = new THREE.Vector3(0,0,1);

    var workplaneOrigin = objToVector(workplaneVertex.workplane.origin, geometryGraph, THREE.Vector3);
    var workplaneAxis   = objToVector(workplaneVertex.workplane.axis, geometryGraph, THREE.Vector3);
    var workplaneAngle  = geometryGraph.evaluate(workplaneVertex.workplane.angle);

    var localPosition = positionOnPlane(sceneElement, event, planeOrigin, planeNormal,
      workplaneOrigin, workplaneAxis, workplaneAngle, camera);
    return localPosition;
  };

  var positionOnPlane = function(sceneElement, event, planeOrigin, planeNormal, workplaneOrigin, workplaneAxis, workplaneAngle, camera) {

    var rotatedPlaneOrigin = rotateAroundAxis(planeOrigin, workplaneAxis, workplaneAngle);
    var origin = new THREE.Vector3().addVectors(rotatedPlaneOrigin, workplaneOrigin);
    var normal = rotateAroundAxis(planeNormal, workplaneAxis, workplaneAngle);

    var mouse = {};
    mouse.x = (event.offsetX / sceneElement.innerWidth()) * 2 - 1;
    mouse.y = -(event.offsetY / sceneElement.innerHeight()) * 2 + 1;

    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    var projector = new THREE.Projector();
    var mouse3D = projector.unprojectVector(vector, camera);

    var ray = new THREE.Ray(camera.position); // To 0,0,0 is the default
    ray.direction = mouse3D.sub(camera.position).normalize();

    // http://en.wikipedia.org/wiki/Line-plane_intersection
    var p0 = origin;
    var l0 = ray.origin;
    var l = ray.direction;
    var n = normal;

    var d = new THREE.Vector3().subVectors(p0, l0).dot(n)/l.dot(n);
    if (d === 0) {
      return undefined;
    }
    var localPosition = new THREE.Vector3().addVectors(l0, l.clone().multiplyScalar(d));
    localPosition.sub(workplaneOrigin);
    localPosition = rotateAroundAxis(localPosition, workplaneAxis, -workplaneAngle);
    localPosition.sub(planeOrigin);
    return localPosition;
  };

  var positionOnRay = function(mouseRay, ray) {
    var from = ray.origin.clone();
    var direction = ray.direction.clone();
    return positionOnVector(mouseRay, [[from, direction]])[0].position;
  };


  var positionOnLine = function(mouseRay, segments) {
    var fromAndDirections = segments.map(function(segment) {
      var direction = segment[1].clone().sub(segment[0]);
      return [segment[0], direction, segment[1]];
    });
    return positionOnVector(mouseRay, fromAndDirections);
  };

  var positionOnVector = function(mouseRay, fromAndDirections) {

    if (mouseRay.origin === undefined) {
      return [];
    }

    return fromAndDirections.map(function(fromAndDirection) {
      var from = fromAndDirection[0];
      var direction = fromAndDirection[1];
      var optionalEnd = fromAndDirection[2];

      // http://softsurfer.com/Archive/algorithm_0106/algorithm_0106.htm
      var u = direction.normalize();
      var v = mouseRay.direction;

      var w0 = new THREE.Vector3().subVectors(from, mouseRay.origin);

      var a = u.dot(u), b = u.dot(v), c = v.dot(v), d = u.dot(w0), e = v.dot(w0);

      var sc = (b*e - c*d)/(a*c - b*b);
      var tc = (a*e - b*d)/(a*c - b*b);

      var psc = new THREE.Vector3().addVectors(from, u.clone().multiplyScalar(sc));
      var qtc = new THREE.Vector3().addVectors(mouseRay.origin, v.clone().multiplyScalar(tc));

      var inEllipse;
      if (optionalEnd) {
        var segmentLength = new THREE.Vector3().subVectors(optionalEnd, from).length();
        var d1 = new THREE.Vector3().subVectors(psc, from).length();
        var d2 = new THREE.Vector3().subVectors(psc, optionalEnd).length();
        inEllipse = d1 + d2 < segmentLength*1.1;
      }

      return {
        position: psc,
        distance: new THREE.Vector3().subVectors(psc, qtc).length(),
        inEllipse: true,
      };
    });

  };


  var toScreenCoordinates = function(width, height, camera, worldCoordinates) {
    worldCoordinates = worldCoordinates.clone();
    var projScreenMat = new THREE.Matrix4();
    projScreenMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    worldCoordinates.applyProjection(projScreenMat);
    return {
      x: width * ((worldCoordinates.x+1)/2),
      y: height * ((-worldCoordinates.y+1)/2)
    };
  };

  var objToVector = function(obj, geometryGraph, Constructor) {
    var evaluate = function(expression) {
      if (geometryGraph) {
        return geometryGraph.evaluate(expression);
      } else {
        return expression;
      }
    };
    if (obj.hasOwnProperty('x')) {
      return new Constructor(
        evaluate(obj.x),
        evaluate(obj.y),
        evaluate(obj.z));
    } else {
      return new Constructor(
        evaluate(obj.u),
        evaluate(obj.v),
        evaluate(obj.w));
    }
  };

  var rotateAroundAxis = function(position, axis, angle) {
    position = position.clone();
    if (angle !== 0) {
      var quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle/180*Math.PI);
      var newPosition = position.applyQuaternion(quaternion);
      return newPosition;
    } else {
      return position;
    }
  };

  var addOffset = function (element, event) {
    event.offsetX = (event.pageX - $(element).offset().left);
    event.offsetY = (event.pageY - $(element).offset().top);
    return event;
  };

  return {
    copyObj       : copyObj,
    mouseRayForEvent  : mouseRayForEvent,
    positionOnWorkplane : positionOnWorkplane,
    positionOnPlane   : positionOnPlane,
    positionOnRay     : positionOnRay,
    positionOnLine    : positionOnLine,
    toScreenCoordinates : toScreenCoordinates,
    objToVector     : objToVector,
    addOffset       : addOffset,
    rotateAroundAxis  : rotateAroundAxis,
  };

});
