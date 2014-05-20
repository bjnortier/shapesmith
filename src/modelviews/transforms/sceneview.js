define([
    'backbone',
    'calculations',
    'scene',
    'scenevieweventgenerator',
    'geometrygraphsingleton',
  ], function(
    Backbone,
    calc,
    sceneModel,
    sceneViewEventGenerator,
    geometryGraph) {

    var SceneView = Backbone.View.extend({

      initialize: function() {
        this.scene = sceneModel.view.scene;

        this.updateCameraScale();
        this.render();
        sceneModel.view.on('cameraMoved', this.cameraMoved, this);
        sceneModel.view.on('cameraMoveStopped', this.cameraMoveStopped, this);
        this.on('mouseenterfirst', this.highlight, this);
        this.on('mouseleavefirst', this.unhighlight, this);
        this.on('dragStarted', this.dragStarted, this);
        this.on('dragEnded', this.dragEnded, this);
        this.on('drag', this.drag, this);
        this.on('mouseenter', this.mouseenter, this);
        this.on('mouseleave', this.mouseleave, this);
      },

      remove: function() {
        this.scene.remove(this.sceneObject);
        sceneViewEventGenerator.deregister(this);
        sceneModel.view.updateScene = true;
        sceneModel.view.off('cameraMoved', this.cameraMoved, this);
        sceneModel.view.off('cameraMoveStopped', this.cameraMoveStopped, this);
        this.off('mouseenterfirst', this.highlight, this);
        this.off('mouseleavefirst', this.unhighlight, this);
        this.off('dragStarted', this.dragStarted, this);
        this.off('dragEnded', this.dragEnded, this);
        this.off('drag', this.drag, this);
        this.off('mouseenter', this.mouseenter, this);
        this.off('mouseleave', this.mouseleave, this);
      },

      render: function() {
        this.clear();

        var quaternion = new THREE.Quaternion();
        var axis = calc.objToVector(
            this.model.vertex.workplane.axis,
            geometryGraph,
            THREE.Vector3);
        var angle = this.model.vertex.workplane.angle/180*Math.PI;

        quaternion.setFromAxisAngle(axis, angle);
        this.sceneObject.useQuaternion = true;
        this.sceneObject.quaternion = quaternion;

        this.sceneObject.position =
          calc.objToVector(
            this.model.vertex.workplane.origin,
            geometryGraph,
            THREE.Vector3);
      },

      clear: function() {
        if (this.sceneObject) {
          this.scene.remove(this.sceneObject);
          sceneViewEventGenerator.deregister(this);
        }
        this.sceneObject = new THREE.Object3D();
        this.hiddenSelectionObject = new THREE.Object3D();
        this.scene.add(this.sceneObject);
        sceneViewEventGenerator.register(this);
        sceneModel.view.updateScene = true;
      },

      isClickable: function() {
        return false;
      },

      isDraggable: function() {
        return !this.dragging;
      },

      cameraMoved: function() {
        this.updateCameraScale();
        sceneModel.view.updateScene = true;
      },

      updateCameraScale: function() {
        var camera = sceneModel.view.camera;
        var cameraDistance = camera.position.length();
        var newScale = cameraDistance/150;
        this.cameraScale = new THREE.Vector3(newScale, newScale, newScale);
      },

      highlight: function() {
        this.updateMaterials(this.highlightLineColor, this.highlightFaceColor);
      },

      unhighlight: function() {
        if (!this.dragging) {
          this.updateMaterials(this.greyLineColor, this.greyFaceColor);
        }
      },

      findObjects: function(sceneObjects) {
        var lines = [], meshes = [];
        var searchFn = function(obj) {
          if (obj.children.length) {
            obj.children.map(searchFn);
          }
          if (obj instanceof THREE.Mesh) {
            meshes.push(obj);
          } else if (obj instanceof THREE.Line) {
            lines.push(obj);
          }
        };
        sceneObjects.forEach(function(obj) {
          searchFn(obj);
        });
        return {lines: lines, meshes: meshes};
      },

      updateMaterials: function(lineColor, faceColor) {
        var objects = this.findObjects([this.sceneObject]);
        objects.lines.forEach(function(line) {
          line.material.color = new THREE.Color(lineColor);
        });
        objects.meshes.forEach(function(mesh) {
          if (mesh.material) {
            mesh.material.color = new THREE.Color(faceColor);
          }
        });
        sceneModel.view.updateScene = true;
      },

    });

    return SceneView;

  });
