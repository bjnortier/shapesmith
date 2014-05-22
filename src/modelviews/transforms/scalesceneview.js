define([
    'calculations',
    'asyncAPI',
    'scene',
    'geometrygraphsingleton',
    './sceneview',
    'modelviews/modelgraph',
  ],
  function(
    calc,
    AsyncAPI,
    sceneModel,
    geometryGraph,
    TransformSceneView,
    modelGraph) {

    var TranslateSceneView = TransformSceneView.extend({

      greyLineColor: 0xcc9999,
      greyFaceColor: 0xcc9999,
      highlightFaceColor: 0xcc3333,
      highlightLineColor: 0xcc3333,

      initialize: function() {
        var extents = this.model.selectedModel.getExtents();
        this.center = extents.center;
        TransformSceneView.prototype.initialize.call(this);
      },

      render: function() {
        TransformSceneView.prototype.render.call(this);

        var extents = this.model.selectedModel.getExtents();

        var boundaryGeometry = new THREE.Geometry();
        var buffer = 5;
        boundaryGeometry.vertices.push(new THREE.Vector3(
          + extents.dx,
          + extents.dy,
          0).add(new THREE.Vector3(extents.center.x, extents.center.y, 0)));
        boundaryGeometry.vertices.push(new THREE.Vector3(
          - extents.dx,
          + extents.dy,
          0).add(new THREE.Vector3(extents.center.x, extents.center.y, 0)));
        boundaryGeometry.vertices.push(new THREE.Vector3(
          - extents.dx,
          - extents.dy,
          0).add(new THREE.Vector3(extents.center.x, extents.center.y, 0)));
        boundaryGeometry.vertices.push(new THREE.Vector3(
          + extents.dx,
          - extents.dy,
          0).add(new THREE.Vector3(extents.center.x, extents.center.y, 0)));
        boundaryGeometry.vertices.push(boundaryGeometry.vertices[0]);
        this.boundary = new THREE.Line(boundaryGeometry,
          new THREE.LineBasicMaterial({ color: this.greyLineColor }));

        this.sceneObject.add(this.boundary);

        var cornerGeometry = new THREE.Geometry();
        cornerGeometry.vertices.push(new THREE.Vector3(0, -buffer/2, 0));
        cornerGeometry.vertices.push(new THREE.Vector3(1, -buffer/2, 0));
        cornerGeometry.vertices.push(new THREE.Vector3(1, buffer/2,  0));
        cornerGeometry.vertices.push(new THREE.Vector3(0, buffer/2, 0));
        cornerGeometry.faces.push(new THREE.Face4(0,1,2,3));
        cornerGeometry.computeFaceNormals();

        this.corners = [
          {
            rotation: 0,
            offset: new THREE.Vector3(extents.dx, 0, 0)
          },
          {
            rotation: Math.PI/2,
            offset: new THREE.Vector3(0, extents.dy, 0)
          },
          {
            rotation: Math.PI,
            offset: new THREE.Vector3(-extents.dx, 0, 0)
          },
          {
            rotation: 3*Math.PI/2,
            offset: new THREE.Vector3(0, -extents.dy, 0)
          },

        ].map(function(rotationAndOffset) {
          var corner = new THREE.Mesh(
            cornerGeometry,
            new THREE.MeshBasicMaterial({color: this.greyFaceColor, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
          );
          corner.position = new THREE.Vector3(extents.center.x, extents.center.y, 0)
            .add(rotationAndOffset.offset);
          corner.rotation.z = rotationAndOffset.rotation;
          this.sceneObject.add(corner);
          corner.scale = this.cameraScale;
          return corner;

        }, this);
      },

      updateCameraScale: function() {
        TransformSceneView.prototype.updateCameraScale.call(this);

        if (this.corners) {
          var that = this;
          this.corners.forEach(function(corner) {
            corner.scale = that.cameraScale;
          });
        }

      },

      dragStarted: function(position, intersection) {
        this.model.hideOtherViews(this);

        this.originalVertex = this.model.vertex;
        this.originalVertex.transforming = true;
        this.editingVertex = AsyncAPI.edit(this.model.vertex);
        this.editingModel = modelGraph.get(this.editingVertex.id);
        this.dragging = true;

        var extents = this.model.selectedModel.getExtents();
        this.initialScale = this.model.vertex.transforms.scale.factor;
        this.initialPosition = position;
        this.centerOnWorkplane = new THREE.Vector3(extents.center.x, extents.center.y, 0);
        this.initialDistance = Math.sqrt(extents.dx*extents.dx + extents.dy*extents.dy);

        if ((intersection.object === this.corners[0]) ||
            (intersection.object === this.corners[2])) {
          this.initialDistance = extents.dx;
        } else {
          this.initialDistance = extents.dy;
        }

      },

      drag: function(position) {
        var extents = this.model.selectedModel.getExtents();

        var distance = new THREE.Vector3().subVectors(
          position, this.centerOnWorkplane).length();

        var scale = Math.round(distance/this.initialDistance*10)/10;

        [
          new THREE.Vector3(extents.center.x, extents.center.y, 0).add(
            new THREE.Vector3(extents.dx*scale, 0, 0)),
          new THREE.Vector3(extents.center.x, extents.center.y, 0).add(
            new THREE.Vector3(0, extents.dy*scale, 0)),
          new THREE.Vector3(extents.center.x, extents.center.y, 0).add(
            new THREE.Vector3(-extents.dx*scale, 0, 0)),
          new THREE.Vector3(extents.center.x, extents.center.y, 0).add(
            new THREE.Vector3(0, -extents.dy*scale, 0)),
        ].map(function(p, i) {
          this.corners[i].position = p;
        }, this);

        [
          new THREE.Vector3(extents.center.x, extents.center.y, 0).add(
            new THREE.Vector3(extents.dx*scale, extents.dy*scale, 0)),
          new THREE.Vector3(extents.center.x, extents.center.y, 0).add(
            new THREE.Vector3(-extents.dx*scale, extents.dy*scale, 0)),
          new THREE.Vector3(extents.center.x, extents.center.y, 0).add(
            new THREE.Vector3(-extents.dx*scale, -extents.dy*scale, 0)),
          new THREE.Vector3(extents.center.x, extents.center.y, 0).add(
            new THREE.Vector3(extents.dx*scale, -extents.dy*scale, 0)),
        ].map(function(p, i) {
          this.boundary.geometry.vertices[i] = p;
        }, this);

        this.boundary.geometry.vertices[4] = this.boundary.geometry.vertices[0];
        this.boundary.geometry.verticesNeedUpdate = true;
        sceneModel.view.updateScene = true;

        // The scale factor parameter is relative to the previous scale
        this.editingModel.scale(
          this.center,
          Math.round(this.initialScale*scale*10)/10);

      },

      dragEnded: function() {
        this.dragging = false;
        this.editingVertex.transforming = false;
        this.editingModel.tryCommit();
      },

      mouseenter: function() {
        this.sceneObject.add(this.axis);
      },

      mouseleave: function() {
        this.sceneObject.remove(this.axis);
      },

    });

    return TranslateSceneView;

  });
