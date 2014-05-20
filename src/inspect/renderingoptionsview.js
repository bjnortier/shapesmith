define([
    'backbone',
    'interactioncoordinator',
    'scene',
  ], function(Backbone, coordinator, sceneModel) {

    var View = Backbone.View.extend({

      id: 'rendering-options',

      initialize: function() {
        this.showing = true;
        this.render();
        this.toggle();
        $('body').append(this.$el);
        coordinator.on('keyup', this.keyup, this);
      },

      render: function() {
        var shadowConfig = {
          near: sceneModel.view.sunLight.shadowCameraNear,
          far: sceneModel.view.sunLight.shadowCameraFar,
          FOV: sceneModel.view.sunLight.shadowCameraFov,
          bias: sceneModel.view.sunLight.shadowBias*10000.0,
          darkness: sceneModel.view.sunLight.shadowDarkness,
        };
        var gui = new dat.GUI({autoPlace: false, hidable: false});

        var lightsCategory = gui.addFolder('Lights');
        lightsCategory.open();

        // Ambient

        var ambientCategory = lightsCategory.addFolder('Ambient');
        ambientCategory.open();
        var ambientConfig = {
          color: '#' + sceneModel.view.ambientLight.color.getHex().toString(16),
        };
        lightsCategory.addColor(ambientConfig, 'color').onChange( function() {
          sceneModel.view.ambientLight.color = new THREE.Color(ambientConfig.color);
          sceneModel.view.updateScene = true;
        });

        // Sun
        var sunCategory = lightsCategory.addFolder('Sun');
        sunCategory.open();
        var sunPosition = sceneModel.view.sunLight.position;
        var sunConfig = {
          frustrum: false,
          r: sunPosition.length(),
          elevation: 90 - Math.acos(sunPosition.z/sunPosition.length())/Math.PI*180,
          azimuth: Math.atan2(sunPosition.y, sunPosition.x)/Math.PI*180,
          color: '#' + sceneModel.view.sunLight.color.getHex().toString(16),
        };

        sunCategory.addColor(sunConfig, 'color').onChange( function() {
          sceneModel.view.sunLight.color = new THREE.Color(sunConfig.color);
          sceneModel.view.updateScene = true;
        });

        var updateSunPosition = function() {
          sceneModel.view.sunLight.position = new THREE.Vector3(
            sunConfig.r*Math.sin((90 - sunConfig.elevation)/180*Math.PI)*Math.cos(sunConfig.azimuth/180*Math.PI),
            sunConfig.r*Math.sin((90 - sunConfig.elevation)/180*Math.PI)*Math.sin(sunConfig.azimuth/180*Math.PI),
            sunConfig.r*Math.cos((90 - sunConfig.elevation)/180*Math.PI));
          sceneModel.view.updateScene = true;
        };

        sunCategory.add(sunConfig, 'r', 0, 2000).onChange(updateSunPosition);
        sunCategory.add(sunConfig, 'elevation', 0, 90).onChange(updateSunPosition);
        sunCategory.add(sunConfig, 'azimuth', -180, 180).onChange(updateSunPosition);

        sunCategory.add(sunConfig, 'frustrum' ).onChange( function() {
          sceneModel.view.sunLight.shadowCameraVisible = sunConfig.frustrum;
          sceneModel.view.updateScene = true;
        });

        // Shadows

        var shadowCategory = sunCategory.addFolder('Shadow');
        shadowCategory.open();

        shadowCategory.add( shadowConfig, 'near', 1, 1500 ).onChange( function() {
          sceneModel.view.sunLight.shadowCamera.near = shadowConfig.near;
          sceneModel.view.sunLight.shadowCamera.updateProjectionMatrix();
          sceneModel.view.updateScene = true;
        });

        shadowCategory.add( shadowConfig, 'far', 1501, 5000 ).onChange( function() {
          sceneModel.view.sunLight.shadowCamera.far = shadowConfig.far;
          sceneModel.view.sunLight.shadowCamera.updateProjectionMatrix();
          sceneModel.view.updateScene = true;
        });

        shadowCategory.add( shadowConfig, 'FOV', 1, 120 ).onChange( function() {
          sceneModel.view.sunLight.shadowCamera.fov = shadowConfig.FOV;
          sceneModel.view.sunLight.shadowCamera.updateProjectionMatrix();
          sceneModel.view.updateScene = true;
        });

        shadowCategory.add( shadowConfig, 'bias', -100.0, 100.0 ).onChange( function() {
          sceneModel.view.sunLight.shadowBias = shadowConfig.bias/10000;
          sceneModel.view.updateScene = true;
        });

        shadowCategory.add( shadowConfig, 'darkness', 0, 1).onChange( function() {
          sceneModel.view.sunLight.shadowDarkness = shadowConfig.darkness;
          sceneModel.view.updateScene = true;
        });


        this.$el.append($(gui.domElement));
      },

      keyup: function(event) {
        if (event.keyCode === 68) {
          this.toggle();
        }
      },

      toggle: function() {
        if (this.showing) {
          this.$el.hide();
        } else {
          this.$el.show();
        }
        this.showing = !this.showing;
      },

    });

    return View;

  });
