define([
    'calculations',
    'scene',
    'geometrygraphsingleton',
    'modelviews/geomvertexMV',
    'modelviews/currentworkplane'
  ], function(
    calc,
    sceneModel,
    geometryGraph,
    GeomVertexMV,
    currentWorkplane) {

    var EditingHeightAnchor = GeomVertexMV.EditingSceneView.extend({

      initialize: function(options) {
        this.vertex = options.vertex;
        this.origin = options.origin;
        this.heightKey = options.heightKey;

        GeomVertexMV.EditingSceneView.prototype.initialize.call(this);
        this.render();
        this.on('dragStarted', this.dragStarted, this);
        this.on('drag', this.drag, this);
        this.on('dragEnded', this.dragEnded, this);
        this.vertex.on('change', this.render, this);
        this.origin.on('change', this.render, this);
      },

      remove: function() {
        GeomVertexMV.EditingSceneView.prototype.remove.call(this);
        this.off('dragStarted', this.dragStarted, this);
        this.off('drag', this.drag, this);
        this.off('dragEnded', this.dragEnded, this);
        this.vertex.off('change', this.render, this);
        this.origin.off('change', this.render, this);
      },

      render: function() {
        GeomVertexMV.EditingSceneView.prototype.render.call(this);

        this.pointSceneObject = THREE.SceneUtils.createMultiMaterialObject(
          new THREE.CylinderGeometry(0, 0.75, 1.5, 3),
          [
            new THREE.MeshBasicMaterial({color: 0x993333, opacity: 0.5, wireframe: false } ),
            new THREE.MeshBasicMaterial({color: 0xcc6666, wireframe: true})
          ]);

        this.originPosition = calc.objToVector(this.origin.parameters.coordinate, geometryGraph, THREE.Vector3);
        this.heightBasePosition = new THREE.Vector3().addVectors(
          this.originPosition,
          new THREE.Vector3(
            geometryGraph.evaluate(this.model.vertex.parameters.width),
            geometryGraph.evaluate(this.model.vertex.parameters.depth),
            0));

        var heightParameterValue = geometryGraph.evaluate(this.model.vertex.parameters[this.heightKey]);
        var zOffset = this.getZOffset(heightParameterValue);
        this.pointSceneObject.position = this.heightBasePosition.clone();
        this.pointSceneObject.position.z += heightParameterValue + zOffset;
        this.pointSceneObject.scale = this.cameraScale;
        this.pointSceneObject.rotation.x = heightParameterValue >= 0 ? Math.PI/2 : 3*Math.PI/2;
        this.sceneObject.add(this.pointSceneObject);

        if (this.showHeightLine) {
          var lineGeometry = new THREE.Geometry();
          lineGeometry.vertices.push(this.heightBasePosition.clone().setZ(-1000));
          lineGeometry.vertices.push(this.heightBasePosition.clone().setZ(1000));
          var line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({color: 0xff6666}));
          this.sceneObject.add(line);
        }

      },

      updateScaledObjects: function() {
        this.pointSceneObject.scale = this.cameraScale;
      },

      getZOffset: function(heightParameterValue) {
        return heightParameterValue < 0 ? -1.5*this.cameraScale.x : 1.5*this.cameraScale.x;
      },

      isDraggable: function() {
        return true;
      },

      dragStarted: function() {
        this.showHeightLine = true;
        this.originPosition = calc.objToVector(this.origin.parameters.coordinate, geometryGraph, THREE.Vector3);
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

        // Local Workplane
        var workplaneOrigin = calc.objToVector(
          this.vertex.workplane.origin,
          geometryGraph,
          THREE.Vector3);
        var workplaneAxis =  calc.objToVector(
          this.vertex.workplane.axis,
          geometryGraph,
          THREE.Vector3);
        var workplaneAngle = geometryGraph.evaluate(this.vertex.workplane.angle);

        var rayOrigin = new THREE.Vector3().addVectors(
          this.originPosition,
          new THREE.Vector3(
            geometryGraph.evaluate(this.vertex.parameters.width),
            geometryGraph.evaluate(this.vertex.parameters.depth),
            0));
        rayOrigin.add(workplaneOrigin);
        var rayOriginUsingWorkplane = calc.rotateAroundAxis(rayOrigin, workplaneAxis, workplaneAngle);
        var rayDirection = new THREE.Vector3(0,0,1);
        var rayDirectionUsingWorkplane = calc.rotateAroundAxis(rayDirection, workplaneAxis, workplaneAngle);
        var ray = new THREE.Ray(rayOriginUsingWorkplane, rayDirectionUsingWorkplane);
        var absolutePositionOnNormal = calc.positionOnRay(mouseRay, ray);

        // Back into local coordinates
        var positionOnNormalInLocalCoords =
          calc.rotateAroundAxis(absolutePositionOnNormal, workplaneAxis, -workplaneAngle);
        var grid = currentWorkplane.getGridSize();
        var h = positionOnNormalInLocalCoords.z - rayOrigin.z;
        this.model.vertex.parameters[this.heightKey] =
          Math.round(parseFloat(h/grid))*grid;

        this.model.vertex.trigger('change', this.model.vertex);
      },

    });

    return EditingHeightAnchor;

  });
