requirejs.config({
  paths: {
    'jquery': 'empty:',
    'underscore': '../node_modules/underscore/underscore',
    'backbone-events': '../node_modules/backbone-events/lib/backbone-events',
    'backbone': '../node_modules/backbone/backbone',
    'uuid': '../node_modules/node-uuid/uuid',
    'csg': 'lib/csg',
  },
  shim: {
    'underscore': {
      exports: '_'
    },
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    'csg': {
      exports: 'CSG',
    },
  },
});

$(document).ready(function() {

  $(".overlay-help").hide();
  // WebGL detector
  var hasWebGL = (function () {
    try {
      return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' );
    } catch(e) {
      return false;
    }
  })();
  if (!hasWebGL) {
    $('#graphs').hide();
    $('#scene').hide();
    $('body').append(
      '<div id="no-webgl">' +
        '<div>Your graphics card does not seem to support WebGL.</div>' +
        '<div>Find out how to get it <a href="http://get.webgl.org">here</a>.</div>' +
        '<div class="browser-icons">' +
          '<img src = "https://raw.github.com/paulirish/browser-logos/master/chrome/chrome_32x32.png">' +
          '<img src = "https://raw.github.com/paulirish/browser-logos/master/safari/safari_32x32.png">' +
          '<img src = "https://raw.github.com/paulirish/browser-logos/master/firefox/firefox_32x32.png">' +
        '</div>' +
      '</div>');
    return;
  }

  requirejs([
      'jquery',
      'lib/jquery.getQueryParam',
      'scene',
      'interactioncoordinator',
      'worldcursor',
      'trackball',
      'commandstack',
      'geometrygraphsingleton',
      'casgraph/ajaxreplicator',
      'variablemanager',
      'modelviews/modelgraph',
      'modelviews/objecttree',
      'webdriverutils',
      'asyncAPI',
      'hintview',
      'inspect/statsview',
      'scripting/designer',
      'csginterface/adapter',
      'designer',
      'progress',
    ], function(
      $, _$,
      sceneModel,
      coordinator,
      worldCursor,
      trackBall,
      commandStack,
      geometryGraph,
      AJAXReplicator,
      variableManager,
      modelGraph,
      objectTree,
      wdutils,
      AsyncAPI,
      hintView,
      StatsView,
      Designer,
      adapter,
      designer,
      progress) {

      designer.init();

      new StatsView();

      var vertexUrl = '/api/' + Shapesmith.user + '/vertex/';
      var graphUrl = '/api/' + Shapesmith.user + '/graph/';
      var replicator = new AJAXReplicator(vertexUrl, graphUrl);
      geometryGraph.attachReplicator(replicator);

      progress.addTrackable(replicator);
      progress.addTrackable(adapter.broker);

      var commitSHA = $.getQueryParam("commit");
      AsyncAPI.loadFromCommit(replicator, commitSHA, function() {

        worldCursor.registerEvents();
        window.onpopstate = function(event) {

          var commit = (event.state && event.state.commit) || $.getQueryParam("commit");
          if (!commandStack.pop(commit)) {
            AsyncAPI.loadFromCommit(replicator, commit);
          }
        };
      });

      window.designer = new Designer();

    });

});
