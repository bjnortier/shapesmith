define([
    'jquery',
    'lib/jquery.getQueryParam',
    'scene',
    'interactioncoordinator',
  ], function($, __$, sceneModel, coordinator) {

    var sceneView = sceneModel.view;
    var camera = sceneView.camera;

    var Trackball = function() {

      var minDistance = 3;
      var maxDistance = 10000;
      var position = { azimuth: Math.PI/4, elevation: 1.08, distance: 1000 };
      var target = { azimuth: Math.PI/4, elevation: 1.08, distance: 300, scenePosition: new THREE.Vector3() };
      var targetCameraPosition = camera.position.clone();
      var lastMousePosition;
      var targetOnDown;
      var state;
      var damping = 0.8;
      var zoomEvents = 0;

      if ($.getQueryParam("noFadein")) {
        damping = 1.0;
        target.distance = 200;
      }

      this.mousedown = function() {
        targetOnDown = {
          azimuth:  target.azimuth,
          elevation: target.elevation,
        };
      };

      this.mouseup = function() {
        if (state) {
          sceneView.stopMoving();
        }
        state = undefined;
        lastMousePosition = undefined;
      };

      this.drag = function(event) {
        if (lastMousePosition) {
          var eventPosition = eventToPosition(event);
          var mouseDownPosition = eventToPosition(event.mouseDownEvent);

          var dMouseFromDown = {
            x: eventPosition.x - mouseDownPosition.x,
            y: eventPosition.y - mouseDownPosition.y,
          };
          var dMouseFromLast = {
            x: eventPosition.x - lastMousePosition.x,
            y: eventPosition.y - lastMousePosition.y,
          };

          if (state === undefined) {
            if (!event.shiftKey && (event.button === 0)) {
              state = 'rotating';
              sceneView.startMoving();
            } else if ((event.button === 1) ||
              ((event.button === 0) && event.shiftKey)) {
              state = 'panning';
              sceneView.startMoving();
            }
          }

          if (state === 'rotating') {
            var zoomDamp = 0.0005 * Math.sqrt(position.distance);
            target.azimuth = targetOnDown.azimuth - dMouseFromDown.x * zoomDamp;
            target.elevation = targetOnDown.elevation - dMouseFromDown.y * zoomDamp;
            target.elevation = target.elevation > Math.PI ? Math.PI : target.elevation;
            target.elevation = target.elevation < 0 ? 0 : target.elevation;
            this.updateCamera();
          }

          if (state === 'panning') {

            var camVec = camera.position.clone().negate().normalize();
            var upVec = new THREE.Vector3(0,0,1);
            var mouseLeftVec = new THREE.Vector3().crossVectors(upVec, camVec);
            var mouseUpVec = new THREE.Vector3().crossVectors(camVec, mouseLeftVec);

            var dPos = mouseLeftVec.clone().multiplyScalar(dMouseFromLast.x).add(
              mouseUpVec.clone().multiplyScalar(dMouseFromLast.y));
            dPos.multiplyScalar(Math.sqrt(position.distance)/50);

            target.scenePosition.add(dPos);
            this.updateCamera();
          }

        }
        lastMousePosition = eventToPosition(event);
      };

      this.mousewheel = function(event) {
        var factor = 0.01;
        event.preventDefault();
        event.stopPropagation();
        if (event.originalEvent.wheelDelta) {
          this.zoom(event.originalEvent.wheelDelta * Math.sqrt(position.distance)*factor);
        }
        // For Firefox
        if (event.originalEvent.detail) {
          this.zoom(-event.originalEvent.detail*120 * Math.sqrt(position.distance)*factor);
        }
      };

      this.keyup = function(event) {
        var factor = 10;
        switch (event.keyCode) {
        case 187:
        case 107:
          this.zoom(Math.sqrt(position.distance)*factor);
          event.preventDefault();
          break;
        case 189:
        case 109:
          this.zoom(-Math.sqrt(position.distance)*factor);
          event.preventDefault();
          break;
        }
      };

      this.zoom = function(delta) {
        ++zoomEvents;

        if (zoomEvents === 1) {
          sceneView.startMoving();
        }

        setTimeout(function() {
          --zoomEvents;
          if (zoomEvents === 0) {
            sceneView.stopMoving();
          }
        }, 200);
        target.distance -= delta;
        this.updateCamera();
      };

      this.updateCamera = function() {
        if (sceneView.renderer.info.memory.geometries > 1000) {
          damping = 1.0;
        }
        var dAzimuth = (target.azimuth - position.azimuth)*damping;
        var dElevation = (target.elevation - position.elevation)*damping;
        var dDistance = (target.distance - position.distance)*damping;

        position.azimuth += dAzimuth;
        position.elevation += dElevation;

        var newDistance = position.distance + dDistance;
        if (newDistance > maxDistance) {
          target.distance = maxDistance;
          position.distance = maxDistance;
        } else if (newDistance < minDistance) {
          target.distance = minDistance;
          position.distance = minDistance;
        } else {
          position.distance = newDistance;
        }

        var newCameraPosition = targetCameraPosition.clone();
        newCameraPosition.x = position.distance * Math.sin(position.elevation) * Math.cos(position.azimuth);
        newCameraPosition.y = position.distance * Math.sin(position.elevation) * Math.sin(position.azimuth);
        newCameraPosition.z = position.distance * Math.cos(position.elevation);
        newCameraPosition.add(sceneView.scene.position);

        var dScenePosition = new THREE.Vector3().subVectors(target.scenePosition, sceneView.scene.position).multiplyScalar(0.2);

        targetCameraPosition = newCameraPosition;

        camera.position = targetCameraPosition;
        sceneView.scene.position.add(dScenePosition);
        camera.lookAt(sceneView.scene.position);

        sceneView.moving();

      };

      coordinator.on('drag', this.drag, this);
      coordinator.on('mousedown', this.mousedown, this);
      coordinator.on('mouseup', this.mouseup, this);
      coordinator.on('mousewheel', this.mousewheel, this);
      coordinator.on('keyup', this.keyup, this);

      this.updateCamera();

    };

    var eventToPosition = function(event) {
      return {
        x: event.offsetX,
        y: event.offsetY,
      };
    };

    return new Trackball();

  });
