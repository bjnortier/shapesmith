define([
    'jquery',
    'underscore',
    'backbone',
  ], function($, _, Backbone) {

    var Model = Backbone.Model.extend({

      initialize: function() {
        this.view = new View({model: this, el: document.getElementById('scene')});
      },

    });

    var View = Backbone.View.extend({

      initialize: function() {

        _.extend(this, Backbone.Events);

        var that = this;
        $(window).resize(function(event) {
          that.resize(event);
        });

        var width = this.$el.width();
        var height = this.$el.height();
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(30, width/height, 1, 50000);
        this.camera.up = new THREE.Vector3(0,0,1);
        this.camera.position = new THREE.Vector3(0,0,1000);
        this.camera.lookAt(new THREE.Vector3(0,0,0));
        this.scene.add(this.camera);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.autoClear = true;
        this.renderer.setClearColorHex(0x080808, 0.0);
        this.renderer.setSize(width, height);

        this.renderer.shadowMapEnabled = true;
        this.renderer.shadowMapType = THREE.PCFShadowMap;

        // var sunIntensity = 1;

        this.ambientLight = new THREE.AmbientLight(0x999999);
        this.scene.add(this.ambientLight);

        // this.sunLight = new THREE.SpotLight( 0xffffff, sunIntensity, 0, Math.PI, 1 );

        // var r = 1000, elevation = 45, azimuth = 45;
        // this.sunLight.position.x = r*Math.sin((90 - elevation)/180*Math.PI)*Math.cos(azimuth/180*Math.PI),
        // this.sunLight.position.y = r*Math.sin((90 - elevation)/180*Math.PI)*Math.sin(azimuth/180*Math.PI),
        // this.sunLight.position.z = r*Math.cos((90 - elevation)/180*Math.PI);

        // this.sunLight.castShadow = true;
        // this.sunLight.shadowCameraVisible = false;
        // this.sunLight.shadowCameraNear = 500;
        // this.sunLight.shadowCameraFar = 4000;
        // this.sunLight.shadowCameraFov = 30;
        // this.sunLight.shadowDarkness = 0.22;
        // this.sunLight.shadowBias = -0.0015;

        // this.scene.add(this.sunLight);

        // Lights
        this.pointLight1 = new THREE.PointLight(0xcccccc);
        this.pointLight1.position.set(1000, 1000, 1000);
        this.scene.add(this.pointLight1);

        this.el.appendChild(this.renderer.domElement);
        this.updateScene = true;
        this.overCameraChangeThreshold = false;
        this.animate();

      },

      animate: function() {
        var that = this;
        var animateFn = function() {
          requestAnimationFrame(animateFn);
          that.render();
        };
        animateFn();
      },

      render: function() {
        // Pre-rendered state
        var lastCameraPosition = this.camera.position.clone();
        if (this.updateScene) {
          this.pointLight1.position = this.camera.position;
          this.renderer.render(this.scene, this.camera);
          this.updateScene = false;

          var cameraDistance = this.camera.position.length();
          var newScale = cameraDistance/150;
          if (Math.round(cameraDistance/10) !== Math.round(lastCameraPosition.length()/10)) {
            this.cameraScale = new THREE.Vector3(newScale, newScale, newScale);
            this.updateScene = true;
          }
        }

      },

      id: 'scene',

      resize: function() {
        this.camera.aspect = $('#scene').innerWidth() / $('#scene').innerHeight();
        this.camera.updateProjectionMatrix();
        this.renderer.setSize($('#scene').innerWidth(), $('#scene').innerHeight());
        this.trigger('cameraMoveStarted', this.camera);
        this.trigger('cameraMoveStopped', this.camera);
        this.updateScene = true;
      },

      startMoving: function() {
        this.trigger('cameraMoveStarted', this.camera);
        this.isMoving = true;
        this.updateScene = true;
      },

      moving: function() {
        this.trigger('cameraMoved', this.camera);
        this.updateScene = true;
      },

      stopMoving: function() {
        this.trigger('cameraMoveStopped', this.camera);
        this.trigger('after:cameraMoveStopped', this.camera);
        this.isMoving = false;
        this.updateScene = true;
      },

    });

    return new Model();

  });
