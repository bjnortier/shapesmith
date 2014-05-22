define([
    'calculations',
    'scene',
    'geometrygraphsingleton',
    'asyncAPI',
    'modelviews/modelgraph',
    './sceneview',
  ], function(calc, sceneModel, geometryGraph, AsyncAPI, modelGraph, TransformSceneView) {

    var camera = sceneModel.view.camera;

    var RotationSceneView = TransformSceneView.extend({

      initialize: function(options) {

        this.isWorkplane = options.isWorkplane;
        this.relativeAngle = 0;

        this.initiator = options.initiator;
        this.model = options.model;
        this.vertex = options.vertex;
        var extents = this.model.getExtents();
        this.radius = Math.sqrt(extents.dx*extents.dx + extents.dy*extents.dy + extents.dz*extents.dz) + 5;

        if (this.isWorkplane) {
          this.rotationObj = this.vertex.workplane;
        } else {
          this.rotationObj = this.vertex.transforms.rotation;
        }

        this.center = extents.center;

        TransformSceneView.prototype.initialize.call(this, options);
        this.vertex.on('change', this.render, this);
      },

      remove: function() {
        TransformSceneView.prototype.remove.call(this);
        this.vertex.off('change', this.render, this);
      },

      render: function() {
        var i, angle, x, y;

        TransformSceneView.prototype.render.call(this);

        var circleGeom = new THREE.Geometry();
        for (i = 0; i <= 360; ++i) {
          angle = i/180*Math.PI;
          x = (this.radius)*Math.cos(angle);
          y = (this.radius)*Math.sin(angle);
          circleGeom.vertices.push(new THREE.Vector3(x,y,0));
        }
        var circleMaterial = new THREE.LineBasicMaterial({
          color: this.greyLineColor,
          linewidth: 1.0
        });
        var circle = new THREE.Line(circleGeom, circleMaterial);

        var arrowGeometry = new THREE.CylinderGeometry(0, 0.75, 2, 3);
        this.arrow = new THREE.Mesh(
          arrowGeometry,
          new THREE.MeshBasicMaterial({color: this.greyFaceColor, transparent: false}));
        this.arrow.position = new THREE.Vector3(this.radius, 0, 0);
        this.arrow.scale = this.cameraScale;

        this.circleAndArrow = new THREE.Object3D();
        this.circleAndArrow.add(this.arrow);
        this.circleAndArrow.add(circle);

        // Separate object so the scene object can be
        // transformed with the workplane
        this.rotationSceneObject = new THREE.Object3D();
        this.sceneObject.add(this.rotationSceneObject);
        this.rotationSceneObject.add(this.circleAndArrow);

        if (!this.isWorkplane) {
          var quat1 = new THREE.Quaternion().setFromAxisAngle(
            this.relativeRotationAxis, 0);
            // Math.PI*this.relativeAngle/180);
          var quat2 = new THREE.Quaternion().setFromAxisAngle(
            calc.objToVector(this.rotationObj.axis, geometryGraph, THREE.Vector3),
            geometryGraph.evaluate(this.rotationObj.angle)/180*Math.PI);
          var quat3 = new THREE.Quaternion().multiplyQuaternions(quat1, quat2);
          quat3.normalize();

          this.rotationSceneObject.useQuaternion = true;
          this.rotationSceneObject.quaternion = quat3;
          this.rotationSceneObject.position = this.center;
        }

      },

      updateCameraScale: function() {
        TransformSceneView.prototype.updateCameraScale.call(this);
        if (this.arrow) {
          this.arrow.scale = this.cameraScale;
        }
      },

      dragStarted: function() {
        this.initiator.hideOtherViews(this);

        if (this.isWorkplane) {
          this.editingVertex = this.vertex;
          this.editingModel = modelGraph.get(this.editingVertex.id);
          this.rotationObj = this.editingVertex.workplane;
        } else {
          this.originalVertex = this.vertex;
          this.originalVertex.transforming = true;
          this.originalVertex.rotating = true;
          this.editingVertex = AsyncAPI.edit(this.vertex);
          this.editingModel = modelGraph.get(this.editingVertex.id);
          this.rotationObj = this.editingVertex.transforms.rotation;
        }
        this.originalAxis = calc.objToVector(this.rotationObj.axis, geometryGraph, THREE.Vector3);
        this.originalAngle = geometryGraph.evaluate(this.rotationObj.angle);
        this.originalOrigin = calc.objToVector(this.center, geometryGraph, THREE.Vector3);
      },

      drag: function(position, intersections, event) {

        var planeNormal = calc.rotateAroundAxis(this.relativeRotationAxis, this.originalAxis, this.originalAngle);
        var planeOrigin = this.originalOrigin.clone();
        var workplaneOrigin = new THREE.Vector3(0,0,0);
        var workplaneAxis = new THREE.Vector3(0,0,1);
        var workplaneAngle = 0;

        if (!this.isWorkplane) {
          // Local Workplane
          workplaneOrigin = calc.objToVector(
            this.editingVertex.workplane.origin,
            geometryGraph,
            THREE.Vector3);
          workplaneAxis =  calc.objToVector(
            this.editingVertex.workplane.axis,
            geometryGraph,
            THREE.Vector3);
          workplaneAngle = geometryGraph.evaluate(this.editingVertex.workplane.angle);
        }

        var positionOnRotationPlane = calc.positionOnPlane($('#scene'), event, planeOrigin, planeNormal, workplaneOrigin, workplaneAxis, workplaneAngle, camera);

        if (!positionOnRotationPlane) {
          return;
        }

        var v1 = positionOnRotationPlane.clone().normalize();
        var v2 = this.getArrowStartPosition().clone().normalize();
        v2 = calc.rotateAroundAxis(
          v2,
          this.originalAxis,
          this.originalAngle);
        var v2CrossV1 = new THREE.Vector3().crossVectors(v2, v1);

        var angle = parseFloat((Math.acos(v1.dot(v2))/Math.PI*180).toFixed(0));
        if (planeNormal.dot(v2CrossV1) < 0) {
          angle = -angle;
        }

        if (this.previousRelativeAngle === undefined) {
          this.previousRelativeAngle = 0;
        } else {
          this.previousRelativeAngle = this.relativeAngle;
        }

        var round = function(value, tolerance) {
          return Math.round(value/tolerance)*tolerance;
        };

        this.relativeAngle = angle;
        if (!event.ctrlKey) {
          this.relativeAngle = round(this.relativeAngle, 5);
          if (this.relativeAngle === 360) {
            this.relativeAngle = 0;
          }
        }

        if (this.relativeAngle !== this.previousRelativeAngle) {
          var quat1 = new THREE.Quaternion().setFromAxisAngle(this.originalAxis, Math.PI*this.originalAngle/180);
          var quat2 = new THREE.Quaternion().setFromAxisAngle(this.relativeRotationAxis, Math.PI*this.relativeAngle/180);
          var quat3 = new THREE.Quaternion().multiplyQuaternions(quat1, quat2);
          quat3.normalize();

          var quaternionToAxisAngle = function(q) {
            var angle = 2*Math.acos(q.w);
            var axis = new THREE.Vector3(q.x/Math.sqrt(1-q.w*q.w),
                                           q.y/Math.sqrt(1-q.w*q.w),
                                         q.z/Math.sqrt(1-q.w*q.w));
            return {angle: angle/Math.PI*180, axis: axis};
          };

          var axisAngle = quaternionToAxisAngle(quat3);


          var rotationOrigin = this.center;
          //  Scale is applied after rotation, so rotation center should be un-scaled
          if (this.vertex.transforms.scale.factor !== 1) {
            var scaleFactor = geometryGraph.evaluate(this.vertex.transforms.scale.factor);
            var rotationOriginVec = calc.objToVector(this.center, geometryGraph, THREE.Vector3);
            rotationOriginVec.multiplyScalar(1/scaleFactor);
            rotationOrigin = {
              x: rotationOriginVec.x,
              y: rotationOriginVec.y,
              z: rotationOriginVec.z,
            };
          }

          this.editingModel.rotate(rotationOrigin, axisAngle);

          if (!this.isWorkplane) {
            quat1 = new THREE.Quaternion().setFromAxisAngle(
              this.relativeRotationAxis, 0);
            quat2 = new THREE.Quaternion().setFromAxisAngle(
              calc.objToVector(this.rotationObj.axis, geometryGraph, THREE.Vector3),
              geometryGraph.evaluate(this.rotationObj.angle)/180*Math.PI);
            quat3 = new THREE.Quaternion().multiplyQuaternions(quat1, quat2);
            quat3.normalize();

            this.rotationSceneObject.useQuaternion = true;
            this.rotationSceneObject.quaternion = quat3;
          }
        }

      },

      dragEnded: function() {
        this.sceneObject.remove(this.axis);
        if (!this.isWorkplane) {
          this.editingVertex.transforming = false;
          this.editingModel.tryCommit();
        }
        this.dragging = false;
      },

    });

    return RotationSceneView;

  });

