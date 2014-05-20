define(['underscore', 'backbone-events', 'casgraph/sha1hasher'],
  function(_, Events, sha1hasher) {

  // Create a new Graph. Any JS object can be inserted and will be
  // referenced by a configurable id. Options:
  //
  // `idKey` the object property used as the `id`. `'id'` by default.
  // `hashFn` a function that generates the object hash. SHA of the JSON by default
  // `stripFn` optional function to strip a object down to the one that will be serialized
  // `serializableFn` optional function to detrmine if a vertex should be serialized
  // `constructionFn` optional function to construct deserialzed vertices
  var CAS = function(options) {

    options = options || {};
    var idKey = options.idKey || 'id';
    var hashFn = options.hashFn || sha1hasher.hash;
    var stripFn = options.stripFn;
    var serializableFn = options.serializableFn || function() { return true; };
    var constructionFn = options.constructionFn || function(obj) { return obj; };

    // For cloning
    this.options = options;

    var vertices = {};
    var outgoingVertices = {};
    var incomingVertices = {};
    var metadata;
    var hashes = {};

    _.extend(this, Events);

    // Put an object in the graph. It must have a unique `idKey` property
    // and not be in the graph already
    this.put = function(object, hash) {
      if (!object.hasOwnProperty(idKey)) {
        throw new Error("object has no '" + idKey + "' property");
      }
      var id = object[idKey];

      if (vertices[id] !== undefined) {
        throw new Error("object with id '" + id + "' already in graph");
      }

      vertices[id] = object;
      outgoingVertices[id] = [];
      incomingVertices[id] = [];
      this.hashIfHashable(id, object, hash);
      updateLeafFirstSequence();
    };

    // Get the object by it's id
    this.get = function(id) {
      return vertices[id];
    };

    // Remove the object by id
    this.remove = function(object) {
      if (!object.hasOwnProperty(idKey)) {
        throw new Error("object has no '" + idKey + "' property");
      }
      var removeId = object[idKey];

      if (vertices[removeId] === undefined) {
        throw new Error("no object '" + removeId + "' in graph");
      }

      outgoingVertices[removeId].forEach(function(toId) {
        var index = incomingVertices[toId].indexOf(removeId);
        incomingVertices[toId].splice(index, 1);
      });
      delete outgoingVertices[removeId];

      incomingVertices[removeId].forEach(function(fromId) {
        var index = outgoingVertices[fromId].indexOf(removeId);
        outgoingVertices[fromId].splice(index, 1);
      });
      delete incomingVertices[removeId];
      delete vertices[removeId];
      updateLeafFirstSequence();
    };

    // Replace the vertex with the same id with this object
    this.replace = function(object) {
      if (!object.hasOwnProperty(idKey)) {
        throw new Error("object has no '" + idKey + "' property");
      }
      var id = object[idKey];

      if (vertices[id] === undefined) {
        throw new Error("no object '" + id + "' in graph");
      }
      vertices[id] = object;
      this.hashIfHashable(id, object);
      updateLeafFirstSequence();
    };

    // Get all the vertices in the graph
    this.vertices = function() {
      return _.values(vertices);
    };

    // Get a vertex with a property value. Enforcing uniqueness
    // is up to the client
    this.getByProperty = function(property, value) {
      return _.find(_.values(vertices), function(v) { return (v[property] === value); });
    };

    // Set the graph metadata
    this.setMetadata = function(data) {
      metadata = data;
    };

    // Get the graph metadata
    this.getMetadata = function() {
      return metadata;
    };

    // Get the hash of the vertex by id
    this.hashForId = function(id) {
      return hashes[id];
    };

    this.hashIfHashable = function(id, object, precomputedHash) {
      if (serializableFn(object)) {
        var strippedObject = stripFn ? stripFn(object) : object;
        var hash;
        if (precomputedHash) {
          hash = precomputedHash;
        } else {
          hash = hashFn(strippedObject);
        }
        hashes[id] = hash;
        this.trigger('vertexHashed', hash, strippedObject);
      } else if (hashes[id]) {
        delete hashes[id];
      }
    };

    // Create an edge between two vertices
    // Both must be in the graph
    this.createEdge = function(from, to) {
      var fromId = from[idKey];
      var toId = to[idKey];
      if (!outgoingVertices[fromId]) {
        throw new Error("no object '" + fromId + "' in graph");
      }
      if (!incomingVertices[toId]) {
        throw new Error("no object '" + toId + "' in graph");
      }
      outgoingVertices[fromId].push(toId);
      incomingVertices[toId].push(fromId);
      updateLeafFirstSequence();
    };

    // Remove an edge between two vertices
    // Both must be in the graph
    this.removeEdge = function(from, to) {
      var fromId = from[idKey];
      var toId = to[idKey];
      if (!outgoingVertices[fromId]) {
        throw new Error("no object '" + fromId + "' in graph");
      }
      if (!incomingVertices[toId]) {
        throw new Error("no object '" + toId + "' in graph");
      }

      var outgoing = outgoingVertices[fromId];
      var index = outgoing.indexOf(toId);
      if (index === -1) {
        throw new Error('no edge from ' + fromId + ' to ' + toId);
      }
      outgoing.splice(index, 1);

      var incoming = incomingVertices[toId];
      index = incoming.indexOf(fromId);
      incoming.splice(index, 1);
      updateLeafFirstSequence();
    };

    // Get the outgoing vertices
    this.getOutgoing = function(from) {
      var fromId = from[idKey];
      if (!outgoingVertices[fromId]) {
        throw new Error('no vertex ' + fromId + ' in graph');
      }
      return outgoingVertices[fromId] ?
        outgoingVertices[fromId].map(function(id) {
          return vertices[id];
        }) : [];
    };

    // Get the incoming vertices
    this.getIncoming = function(from) {
      var fromId = from[idKey];
      if (!incomingVertices[fromId]) {
        throw new Error('no vertex ' + fromId + ' in graph');
      }
      return incomingVertices[fromId] ?
        incomingVertices[fromId].map(function(id) {
          return vertices[id];
        }) : [];
    };

    // Serialize the graph into a single object
    this.serialize = function() {
      var result = {
        vertices: {},
        edges: {},
      };

      _.keys(vertices).map(function(id) {
        // Serializable vertices will have hashes
        if (hashes[id]) {
          result.vertices[id] = stripFn ?
            stripFn(vertices[id]) : vertices[id];
        }
      });

      var that = this;
      _.keys(vertices).map(function(fromId) {
        var outgoingVertices = that.getOutgoing(vertices[fromId]);
        // Serializable vertices will have hashes
        if (hashes[fromId] && outgoingVertices.length) {
          result.edges[fromId] = outgoingVertices.map(function(to) {
            return to[idKey];
          });
        }
      });

      if (metadata !== undefined) {
        result.metadata = metadata;
      }

      return result;
    };

    // Serialize a hashed version of the graph using a
    // Content-addressable-storage technique,
    // where the content of the vertex is hashed to create a key. All objects
    // that are equal will have the same key.
    // http://en.wikipedia.org/wiki/Content-addressable_storage
    this.hashSerialize = function() {
      var result = {
        vertices: [],
        edges: {}
      };

      _.keys(vertices).forEach(function(id) {
        if(hashes[id] !== undefined) {
          result.vertices.push(hashes[id]);
        }
      });

      var that = this;
      _.keys(vertices).map(function(fromId) {
        var outgoingVertices = that.getOutgoing(vertices[fromId]);
        // Serializable vertices will have hashes
        if (hashes[fromId] && (outgoingVertices.length > 0)) {
          result.edges[hashes[fromId]] = outgoingVertices.map(function(to) {
            return hashes[to[idKey]];
          });
        }
      });

      if (metadata !== undefined) {
        result.metadata = metadata;
      }
      return result;
    };

    // Get the hash of the hash-serialized graph
    this.getHash = function() {
      return hashFn(this.hashSerialize());
    };

    // Hash the graph and notify the replicator
    this.hashGraphAndNotify = function() {
      var result = this.hashSerialize();
      var hash = hashFn(result);
      this.trigger('graphHashed', hash, result);
      return hash;
    };

    // Reconstruct the graph from the CAS representation
    this.fromHashSerialization = function(hashedGraph, hashesToVertices) {
      if (_.keys(vertices).length) {
        throw new Error('Cannot reconstruct - graph not empty');
      }

      _.keys(hashesToVertices).forEach(function(hash) {
        var obj = hashesToVertices[hash];
        var id = obj[idKey];
        vertices[id] = constructionFn(obj);
        outgoingVertices[id] = [];
        incomingVertices[id] = [];
        hashes[id] = hash;
      });

      _.keys(hashedGraph.edges).forEach(function(fromHash) {
        var fromId = hashesToVertices[fromHash][idKey];
        hashedGraph.edges[fromHash].forEach(function(toHash) {
          var toId = hashesToVertices[toHash][idKey];
          outgoingVertices[fromId].push(toId);
          incomingVertices[toId].push(fromId);
        });
      });

      metadata = hashedGraph.metadata;
      updateLeafFirstSequence();
    };

    // Clone a graph by creating a snapshot of this graph
    // References to vertices will be shared between
    // the two graphs, but they can be modified independantly
    // afterwards
    this.clone = function() {
      var newGraph = new CAS(this.options);

      _.keys(vertices).forEach(function(id) {
        newGraph.put(vertices[id], hashes[id]);
      });
      _.keys(outgoingVertices).forEach(function(fromId) {
        var toIds = outgoingVertices[fromId];
        toIds.forEach(function(toId) {
          newGraph.createEdge(vertices[fromId], vertices[toId]);
        });
      });
      if (metadata !== undefined) {
        newGraph.setMetadata(JSON.parse(JSON.stringify(metadata)));
      }
      return newGraph;
    };

    // Generate diff events when switching to a different graph.
    // For example this can be used to support undo/redo -
    // where the "current" graph is swapped with another
    // (previously cloned) one. Events are generated
    // for adding, removing and replacing vertices. Edge
    // events are considered implicit
    this.diffFrom = function(fromGraph, listener) {
      var toGraph = this;

      // Contruct the ids sequence as a leaf-first sequence so that
      // listeners will be notified in the correct order
      var fromIds = [];
      fromGraph.leafFirstSearch(function(v) {
        fromIds.push(v[idKey]);
      });
      var toIds = [];
      toGraph.leafFirstSearch(function(v) {
        toIds.push(v[idKey]);
      });

      // Added/removed
      var verticesRemoved = _.difference(fromIds, toIds);
      var verticesAdded = _.difference(toIds, fromIds);
      verticesRemoved.forEach(function(id) {
        listener({vertexRemoved: fromGraph.get(id)});
      });
      verticesAdded.forEach(function(id) {
        listener({vertexAdded: toGraph.get(id)});
      });

      // Replaced
      var verticesWithSameId = _.intersection(fromIds, toIds);
      verticesWithSameId.forEach(function(id) {
        listener({
          vertexReplaced: {
            from: fromGraph.get(id),
            to: toGraph.get(id)
          }
        });
      });

      // Metadata changed
      var fromMetadata = fromGraph.getMetadata();
      var toMetadata = toGraph.getMetadata();
      if (hashFn(fromMetadata) !== hashFn(toMetadata)) {
        listener({
          metadataChanged: {
            from: fromMetadata,
            to: toMetadata
          }
        });
      }

    };

    // This is an optimisation for bulk leaf traversals. We re-evaluate
    // the depths of each vertex when an edge is added or removed, and use
    // this for fast traversal
    var leafFirstSequence = [];

    var updateLeafFirstSequence = function() {
      leafFirstSequence = [];

      var remainingIds = _.pluck(vertices, idKey);
      var visitedIds   = [];

      // For each vertex in the graph, check if all the children
      // have been visited. If yes, then visit it.
      var sanity = remainingIds.length + 1;
      while ((remainingIds.length > 0) && (sanity > 0)) {
        --sanity;
        if (sanity === 0) {
          console.error(_.keys(vertices));
          console.error(outgoingVertices);
          console.error(incomingVertices);
          throw new Error('leaf first search infinite loop');
        }
        for (var i in remainingIds) {
          var vertex = vertices[remainingIds[i]];
          var outgoingVertexIds = outgoingVertices[vertex.id];

          // Use uniqe ids since a vertex can be in the outgoing
          // array multiple times
          var uniqueOutgoingVertexIds = _.uniq(outgoingVertexIds);
          if (_.intersection(uniqueOutgoingVertexIds, visitedIds).length === uniqueOutgoingVertexIds.length) {
            leafFirstSequence.push(vertex);
            visitedIds.push(vertex.id);
            remainingIds.splice(remainingIds.indexOf(vertex.id), 1);
            break;
          }
        }
      }
    };

    // Traverse the graph with a leaf-first search
    this.leafFirstSearch = function(listener) {
      leafFirstSequence.forEach(function(v) {
        listener(v);
      });
    };

  };

  return CAS;

});
