define(['underscore', 'backbone-events'], function(_, Events) {

  // Abstract CAS graph replicator
  var Replicator = function(readers, writers) {
    if (typeof readers.vertex !== 'function') {
      throw new Error('readers.vertex not a function');
    }
    if (typeof readers.graph !== 'function') {
      throw new Error('readers.graph not a function');
    }
    if (typeof writers.vertex !== 'function') {
      throw new Error('writers.vertex not a function');
    }
    if (typeof writers.graph !== 'function') {
      throw new Error('writers.graph not a function');
    }

    var that = this;

    _.extend(this, Events);
    this.inProgress = 0;
    this.errors = 0;

    // A vertex has been hashed - replicate it
    this.vertexHashed = function(hash, vertex) {
      this.objectHashed(writers.vertex, hash, vertex);
    };

    // A graph has been hashed - replicate it
    this.graphHashed = function(hash, graph) {
      this.objectHashed(writers.graph, hash, graph);
    };

    // An object has been hashed - replicate it
    this.objectHashed = function(writer, hash, object) {
      ++this.inProgress;
      writer(hash, object, function(success, errorMsg) {
        if (success) {
          that.trigger('written', hash, object);
          --that.inProgress;
        } else {
          --that.inProgress;
          ++that.errors;
          console.error(errorMsg);
        }
      });
    };

    // Read a graph. The readers may be asynchronous
    // so callbacks are used. Each vertex in the graph is read
    // and stored in a map of hashes to vertices. The the
    // vertices and edges are added to the graph
    this.readGraph = function(graphHash, callback) {
      var that = this;
      readers.graph(graphHash, function(success, graphHash, hashedGraph) {

        // Read all the vertices into a map of hases to vertices
        var vertexHashes = hashedGraph.vertices;
        var remaining = vertexHashes.length;

        if (!remaining) {
          callback(true, hashedGraph, {});
        }

        var hashesToVertices = {};

        var vertexRead = function(success, hash, vertex) {
          hashesToVertices[hash] = vertex;
          --remaining;
          if (!remaining) {
            that.attachedGraph.fromHashSerialization(hashedGraph, hashesToVertices);
            callback(true);
          }
        };

        vertexHashes.forEach(function(vertexHash) {
          readers.vertex(vertexHash, vertexRead);
        });

      });
    };

    // Attach to a graph
    this.attachTo = function(graph) {
      graph.on('vertexHashed', this.vertexHashed, this);
      graph.on('graphHashed', this.graphHashed, this);
      this.attachedGraph = graph;
    };

    // Detach from a graph
    this.detachFrom = function(graph) {
      graph.off('vertexHashed', this.vertexHashed, this);
      graph.off('graphHashed', this.graphHashed, this);
      delete this.attachedGraph;
    };

  };

  return Replicator;

});
