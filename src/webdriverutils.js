var SS = SS || {};

define(['scene', 'trackball', 'calculations'],
  function(sceneModel, trackball, calc) {

    SS.dontDampTrackball = function() {
      trackball.dontDamp();
    };

    SS.toScreenCoordinates = function(x, y, z) {
      var camera = sceneModel.view.camera;
      return calc.toScreenCoordinates($('#scene').innerWidth(), $('#scene').innerHeight(), camera, new THREE.Vector3(x,y,z));
    };

    SS.zoomIn = function() {
      trackball.zoom(100);
      trackball.updateCamera();
    };

  });
