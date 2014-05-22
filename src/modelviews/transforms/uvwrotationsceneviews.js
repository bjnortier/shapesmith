define([
    './rotationsceneview'
  ], function(RotationSceneView) {

    var U = RotationSceneView.extend({

      greyLineColor: 0x9999cc,
      greyFaceColor: 0x9999cc,
      highlightFaceColor: 0x3333cc,
      highlightLineColor: 0x3333cc,

      initialize: function(options) {
        RotationSceneView.prototype.initialize.call(this, options);
      },

      render: function() {
        RotationSceneView.prototype.render.call(this);
        this.circleAndArrow.rotation.y = Math.PI/2;
        this.circleAndArrow.rotation.x = Math.PI/2;
      },

      getArrowStartPosition: function() {
        return new THREE.Vector3(0, this.radius, 0);
      },

      relativeRotationAxis: new THREE.Vector3(1,0,0),

    });

    var V = RotationSceneView.extend({

      greyLineColor: 0x99cc99,
      greyFaceColor: 0x99cc99,
      highlightFaceColor: 0x33cc33,
      highlightLineColor: 0x00ff00,

      initialize: function(options) {
        RotationSceneView.prototype.initialize.call(this, options);
      },

      render: function() {
        RotationSceneView.prototype.render.call(this);
        this.circleAndArrow.rotation.x = -Math.PI/2;
        this.circleAndArrow.rotation.z = -Math.PI/2;
      },

      getArrowStartPosition: function() {
        return new THREE.Vector3(0, 0, this.radius);
      },

      relativeRotationAxis: new THREE.Vector3(0,1,0),

    });

    var W = RotationSceneView.extend({

      greyLineColor: 0xcc9999,
      greyFaceColor: 0xcc9999,
      highlightFaceColor: 0xcc3333,
      highlightLineColor: 0xcc3333,

      initialize: function(options) {
        RotationSceneView.prototype.initialize.call(this, options);
      },

      render: function() {
        RotationSceneView.prototype.render.call(this);
      },

      getArrowStartPosition: function() {
        return new THREE.Vector3(this.radius, 0, 0);
      },

      relativeRotationAxis: new THREE.Vector3(0,0,1),

    });

    return {
      U: U,
      V: V,
      W: W,
    };

  });
