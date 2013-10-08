define([
    'graphapi',
  ], function(GraphAPI) {

    var createNewGraph = function(db, username, callback) {
      
      var emptyGraph = {
        vertices: [],
        edges: [],
        metadata: [],
      };
      create(db, username, 'graph', emptyGraph, callback);

    };

    var create = function(db, username, type, object, callback) {
      var sha = GraphAPI.hashObject(object);
      var key = createKey(username, type, sha);
      db.set(key, object, function(err) {
        callback(err, sha);
      });

    };

    var get = function(db, username, type, sha, callback) {
      var key = createKey(username, type, sha);
      db.get(key, callback);
    };

    var createKey = function(username, type, sha) {
      return username + '/' + type + '/' + sha;
    };

    return {
      createNewGraph: createNewGraph,
      create        : create,
      get           : get,
    };

  });