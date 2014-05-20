var path = require('path');
var requirejs = require('requirejs');
var baseUrl = path.join(__dirname, "..");
requirejs.config({
  baseUrl: baseUrl,
  nodeRequire: require,
});

var graphapi = requirejs('graphapi');

var createKey = function(username, type, sha) {
  return type + '/' + sha;
};

var create = function(db, username, type, object, callback) {
  var sha = graphapi.hashObject(object);
  var key = createKey(username, type, sha);
  db.set(key, object, function(err) {
    callback(err, sha);
  });

};

module.exports.createNewGraph = function(db, username, callback) {

  var emptyGraph = {
    vertices: [],
    edges: [],
    metadata: [],
  };
  create(db, username, 'graph', emptyGraph, callback);

};

module.exports.get = function(db, username, type, sha, callback) {
  var key = createKey(username, type, sha);
  db.get(key, callback);
};

module.exports.create = create;
