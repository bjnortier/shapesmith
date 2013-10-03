var requirejs = require('requirejs');

requirejs.config({
  baseUrl: 'src',
  nodeRequire: require,
});

var chai = requirejs('chai');
assert = chai.assert;
chai.Assertion.includeStack = true;

var specs = requirejs('./test/unitspecs.js');
specs.forEach(function(spec) {
  requirejs(spec);
});
