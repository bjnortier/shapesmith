define([
    'calculations',
    'scene',
    'geometrygraphsingleton',
    'modelviews/currentworkplane',
    'modelviews/geomvertexMV',
  ], function(
    calc,
    sceneModel,
    geometryGraph,
    currentWorkplane,
    GeomVertexMV) {

    var ZAnchor = GeomVertexMV.EditingSceneView.extend({

      initialize: function(options) {
        this.vertex = options.vertex;
        this.origin = options.origin;
        this.isGlobal = options.isGlobal;

        GeomVertexMV.EditingSceneView.prototype.initialize.call(this);
        this.render();
        this.on('dragStarted', this.dragStarted, this);
        this.on('drag', this.drag, this);
        this.on('dragEnded', this.dragEnded, this);
      },

      remove: function() {
        GeomVertexMV.EditingSceneView.prototype.remove.call(this);
        this.off('dragStarted', this.dragStarted, this);
        this.off('drag', this.drag, this);
        this.off('dragEnded', this.dragEnded, this);
      },

      render: function() {

        GeomVertexMV.EditingSceneView.prototype.render.call(this);

        this.pointSceneObject = THREE.SceneUtils.createMultiMaterialObject(
          new THREE.CylinderGeometry(0, 0.75, 1.5, 3),
          [
            new THREE.MeshBasicMaterial({color: 0x993333, opacity: 0.5, wireframe: false } ),
            new THREE.MeshBasicMaterial({color: 0xcc6666, wireframe: true})
          ]);
        var pointPosition = calc.objToVector(this.origin, geometryGraph, THREE.Vector3);

        this.pointSceneObject.position = pointPosition;
        this.pointSceneObject.position.z += 1.5*this.cameraScale.x;
        this.pointSceneObject.scale = this.cameraScale;
        this.pointSceneObject.rotation.x = Math.PI/2;
        this.sceneObject.add(this.pointSceneObject);

        if (this.showHeightLine) {
          var lineGeometry = new THREE.Geometry();
          lineGeometry.vertices.push(pointPosition.clone().setZ(-1000));
          lineGeometry.vertices.push(pointPosition.clone().setZ(1000));
          var line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({color: 0xff6666}));
          this.sceneObject.add(line);
        }

      },

      updateScaledObjects: function() {
        this.pointSceneObject.scale = this.cameraScale;
      },

      isDraggable: function() {
        return true;
      },

      dragStarted: function() {
        this.showHeightLine = true;
        this.rayOrigin = calc.objToVector(
          this.origin,
          geometryGraph,
          THREE.Vector3);
      },

      dragEnded: function() {
        this.showHeightLine = false;
        this.model.vertex.trigger('change', this.model.vertex);
      },

      drag: function(workplanePosition, intersection, event) {
        this.dragging = true;

        var sceneElement = $('#scene');
        var camera = sceneModel.view.camera;
        var mouseRay = calc.mouseRayForEvent(sceneElement, camera, event);

        var rayDirection = new THREE.Vector3(0,0,1);
        var ray = new THREE.Ray(this.rayOrigin, rayDirection);
        var absolutePositionOnNormal = calc.positionOnRay(mouseRay, ray);
        var h = absolutePositionOnNormal.z - this.rayOrigin.z;

        if (!this.isGlobal) {
          // Apply Workplane
          var workplaneOrigin = calc.objToVector(
            this.vertex.workplane.origin,
            geometryGraph,
            THREE.Vector3);
          var workplaneAxis = calc.objToVector(
            this.vertex.workplane.axis,
            geometryGraph,
            THREE.Vector3);
          var workplaneAngle = geometryGraph.evaluate(this.vertex.workplane.angle);

          var rayOriginUsingWorkplane = calc.rotateAroundAxis(this.rayOrigin, workplaneAxis, workplaneAngle);
          rayOriginUsingWorkplane.add(workplaneOrigin);

          var rayDirectionUsingWorkplane = calc.rotateAroundAxis(rayDirection, workplaneAxis, workplaneAngle);

          ray = new THREE.Ray(rayOriginUsingWorkplane, rayDirectionUsingWorkplane);
          absolutePositionOnNormal = calc.positionOnRay(mouseRay, ray);

          // Back into local coordinates
          var positionOnNormalInLocalCoords =
            calc.rotateAroundAxis(absolutePositionOnNormal, workplaneAxis, -workplaneAngle);
          positionOnNormalInLocalCoords.sub(workplaneOrigin);

          h = positionOnNormalInLocalCoords.z - this.rayOrigin.z;
        }

        var grid = currentWorkplane.getGridSize();
        this.origin.z = this.rayOrigin.z + Math.round(parseFloat(h/grid))*grid;

        this.vertex.trigger('change', this.vertex);
      },

    });

    return ZAnchor;

  });
