requirejs.config({
    paths: {
        'jquery': 'empty:',
        'underscore': '../node_modules/underscore/underscore',
        'backbone-events': '../node_modules/backbone-events/lib/backbone-events',
        'backbone': '../node_modules/backbone/backbone',
        'lathe': '../node_modules/lathe/lib',
        'gl-matrix': '../node_modules/lathe/node_modules/gl-matrix/dist/gl-matrix',
    },
    shim: {
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
    },
});

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
        'latheapi/adapter',
        'designer',
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
        designer) {

    $(document).ready(function() {

        designer.init();

        var statsView = new StatsView();

        var vertexUrl = '/_api/' + globals.user + '/' + globals.design + '/vertex/';
        var graphUrl = '/_api/' + globals.user + '/' + globals.design + '/graph/';
        var replicator = new AJAXReplicator(vertexUrl, graphUrl);
        geometryGraph.attachReplicator(replicator);

        var commitSHA = $.getQueryParam("commit");
        AsyncAPI.loadFromCommit(replicator, commitSHA, function() {

            worldCursor.registerEvents();
            window.onpopstate = function(event) { 
            
                var commit = (event.state && event.state.commit) || $.getQueryParam("commit");
                if (!commandStack.pop(commit)) {
                    AsyncAPI.loadFromCommit(replicator, commit);
                }    
            }
        });

        window.designer = new Designer();

    });

});
