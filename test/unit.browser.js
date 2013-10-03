requirejs.config({
  baseUrl:'../src',
  paths: {
    'underscore': '../node_modules/underscore/underscore',
    'backbone-events': '../node_modules/backbone-events/lib/backbone-events',
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

chai.Assertion.includeStack = true;

requirejs(['./unitspecs.js'], function(specs) {

  assert = chai.assert;

  require(specs, function() {
    mocha.setup('bdd');
    mocha.run();
  });

});
