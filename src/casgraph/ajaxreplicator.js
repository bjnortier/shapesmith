define([
    'jquery',
    'casgraph/replicator',
    'progresstrackable',
  ],
  function($, Replicator, progressTrackable) {

    var AJAXReplicator = function(vertexUrl, graphUrl) {

      var that = this;

      var writeVertex = function(hash, vertex, callback) {
        write(vertexUrl, hash, vertex, callback);
      };

      var writeGraph = function(hash, graph, callback) {
        write(graphUrl, hash, graph, callback);
      };

      var write = function(url, hash, object, callback) {

        var tracker = progressTrackable.create(that);

        $.ajax({
          type: 'POST',
          url: url,
          contentType: 'application/json',
          data: JSON.stringify(object),
          dataType: 'json',
          success: function(serverHash) {
            tracker.finish();
            if (serverHash === hash) {
              callback(true);
            } else {
              callback(false, 'error: server hash doesn\'t match. Expected: ' + hash + ' received: ' + serverHash);
            }
          },
          error: function(result) {
            tracker.finish();
            callback(false, result);
          }
        });

      };

      var readVertex = function(hash, callback) {
        read(vertexUrl, hash, callback);
      };

      var readGraph = function(hash, callback) {
        read(graphUrl, hash, callback);
      };

      var read = function(url, hash, callback) {

        var tracker = progressTrackable.create(that);
        $.ajax({
          type: 'GET',
          url: url + hash,
          dataType: 'json',
          success: function(result) {
            tracker.finish();
            callback(true, hash, result);
          },
          error: function(msg) {
            tracker.finish();
            callback(false, msg);
          }
        });

      };

      var readers = {
        graph: readGraph,
        vertex: readVertex,
      };

      var writers = {
        vertex: writeVertex,
        graph: writeGraph,
      };

      Replicator.prototype.constructor.call(this, readers, writers);
    };

    return AJAXReplicator;

  });
