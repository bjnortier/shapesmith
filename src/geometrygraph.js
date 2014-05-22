define([
    'underscore',
    'backbone-events',
    'casgraph/graph',
    'geomnode',
    'variablegraph',
    'layers/layertree',
  ],
  function(_, Events, CASGraph, geomNode, variableGraphLib, LayerTree) {

    var GeometryGraph = function() {

      _.extend(this, Events);
      geomNode.resetIDCounters();

      var graph = new CASGraph({
        stripFn : geomNode.strip,
        serializableFn: function(vertex) {
          return !vertex.editing;
        },
        constructionFn: function(obj) {
          if (!geomNode.constructors[obj.type]) {
            throw new Error('no GeomNode constructor for ' + obj.type);
          }
          return new geomNode.constructors[obj.type](obj);
        }
      });

      var snapshots = [];
      var currentSnapshotIndex = -1;

      var varGraph = new variableGraphLib.Graph(graph);
      var that = this;

      this.layerTree = new LayerTree();

      this.removeAll = function() {
        graph.vertices().forEach(function(vertex) {
          that.remove(vertex);
        });
      };

      // ---------- Validation ----------

      this.validate = function(vertex) {
        vertex.errors = {};

        var schemaErrors = vertex.validateSchema();

        if (_.keys(schemaErrors).length) {
          _.extend(vertex.errors, schemaErrors);
        } else {

          var expressionErrors = this.validateExpressions(vertex.getExpressions());
          if (_.keys(expressionErrors).length) {
            _.extend(vertex.errors, expressionErrors);
          } else {

            if (vertex.type === 'variable') {
              if (!new variableGraphLib.Graph(graph).canAdd(vertex)) {
                vertex.errors = {name: 'invalid', expression: 'invalid'};
              }
              var original = snapshots[currentSnapshotIndex] && snapshots[currentSnapshotIndex].get(vertex.id);
              if (original) {
                // Variable is being used by geometry
                if ((original.name !== vertex.name) && (this.parentsOf(vertex).length)) {
                  vertex.errors = {name: 'has dependants'};
                }
              }
            }
          }
        }

        var noErrors = _.keys(vertex.errors).length === 0;
        if (!noErrors) {
          vertex.trigger('change', vertex);
        }
        return noErrors;
      };

      this.validateExpressions = function(expressions) {
        var result = {};
        for(var field in expressions) {
          var expression = expressions[field];
          if (expression === undefined) {
            result[field] = 'missing';
            continue;
          }
          try {
            varGraph.evaluate(expression);
          } catch (e) {
            result[field] = "invalid expression: '" + expression + "'";
            continue;
          }
        }
        return result;
      };


      // ---------- Prototypes ----------

      this.createPointPrototype = function(options) {
        options = _.extend(options || {}, {
          editing    : true,
          proto    : true,
        });
        var pointVertex = new geomNode.Point(options);
        this.add(pointVertex);
        return pointVertex;
      };

      this.createPolylinePrototype = function(options) {
        options = options || {};
        var pointVertex = new geomNode.Point({
          editing: true,
          proto: true,
          implicit: true,
          workplane: options.workplane,
        });
        this.add(pointVertex);

        var polylineOptions = _.extend(options || {}, {
          editing    : true,
          proto    : true,
        });
        var polylineVertex = new geomNode.Polyline(polylineOptions);

        this.add(polylineVertex, function() {
          graph.createEdge(polylineVertex, pointVertex);
        });
        return polylineVertex;
      };

      this.createExtrudePrototype = function(child, height) {
        var extrudeVertex = new geomNode.Extrude({
          editing  : true,
          proto    : true,
          parameters : {vector: {u: '0', v:'0', w:'1'}, height: height},
        });
        this.add(extrudeVertex, function() {
          graph.createEdge(extrudeVertex, child);
        });
        return extrudeVertex;
      };

      this.createVariablePrototype = function() {
        var vertex = new geomNode.Variable({
          name: 'placeholder',
          editing    : true,
          proto    : true,
          parameters: {
            expression: ''
          }
        });
        this.add(vertex);
      };

      // ---------- Mutations ----------

      this.addPointToParent = function(parent, point) {
        if (point === undefined) {
          point = new geomNode.Point({
            editing: true,
            proto: true,
            implicit: true,
            workplane: parent.workplane,
          });
          this.add(point, function() {
            graph.createEdge(parent, point);
          });
        } else {
          graph.createEdge(parent, point);
        }
        parent.trigger('change', parent);
        return point;
      };

      this.removeLastPointFromPolyline = function(polyline) {
        var children = this.childrenOf(polyline);
        if (children.length === 0) {
          throw new Error('Cannot remove last point from empty polyline');
        }
        this.remove(children[children.length - 1]);
      };

      this.addEdge = function(from, to) {
        graph.createEdge(from, to);
      };

      // ---------- Capture & undo/redo ----------

      this.getHash = function() {
        return graph.getHash();
      };

      this.capture = function() {
        var snapshot = graph.clone();
        snapshots[++currentSnapshotIndex] = snapshot;
        return graph.hashGraphAndNotify();
      };

      this.diffListener = function(event) {
        var vertex;
        if (event.vertexAdded) {
          vertex = event.vertexAdded;
          vertex.on('change', this.vertexChanged, this);
          that.trigger('vertexAdded', vertex);
        } else if (event.vertexRemoved) {
          vertex = event.vertexRemoved;
          vertex.off('change', that.vertexChanged, this);
          that.trigger('vertexRemoved', vertex);
        } else if (event.vertexReplaced) {
          var original = event.vertexReplaced.from;
          var replacement = event.vertexReplaced.to;
          that.updateVariableEdges(replacement);
          that.setupEventsForReplacement(original, replacement);
        } else if (event.metadataChanged) {
          that.layerTree.fromObj(event.metadataChanged.to);
          that.layerTree.trigger('change');
        }
      };

      this.undo = function() {
        if (currentSnapshotIndex === 0) {
          throw new Error('no snapshot to undo to');
        }
        var from = snapshots[currentSnapshotIndex];

        if (this.replicator) {
          this.replicator.detachFrom(graph);
        }
        graph = snapshots[--currentSnapshotIndex].clone();
        varGraph = new variableGraphLib.Graph(graph);
        if (this.replicator) {
          this.replicator.attachTo(graph);
        }

        graph.diffFrom(from, this.diffListener);
      };

      this.redo = function() {
        if (currentSnapshotIndex === (snapshots.length-1)) {
          throw new Error('no snapshot to redo to');
        }
        var from = snapshots[currentSnapshotIndex];

        if (this.replicator) {
          this.replicator.detachFrom(graph);
        }
        graph = snapshots[++currentSnapshotIndex].clone();
        varGraph = new variableGraphLib.Graph(graph);
        if (this.replicator) {
          this.replicator.attachTo(graph);
        }

        graph.diffFrom(from, this.diffListener);
      };

      this.attachReplicator = function(replicator) {
        this.replicator = replicator;
        this.replicator.attachTo(graph);
      };

      this.setMetadata = function(data) {
        graph.setMetadata(data);
      };

      this.getMetadata = function() {
        return graph.getMetadata();
      };

      // ---------- Variable functions ----------

      this.evaluate = function(expression) {
        try {
          return varGraph.evaluate(expression);
        } catch (e) {
          if (e instanceof variableGraphLib.ParseError) {
            console.error('Exception when evaluating expression', expression, e);
          }
          throw e;
        }
      };

      // ---------- Graph functions ----------

      this.updateVariableEdges = function(vertex) {
        if (!vertex.editing) {
          var variableChildren = this.childrenOf(vertex).filter(function(v) {
            return v.type === 'variable';
          });
          variableChildren.map(function(child) {
            graph.removeEdge(vertex, child);
          });
          var expressions = _.values(vertex.getExpressions());
          var newVariableChildren = [];
          expressions.forEach(function(expr) {
            newVariableChildren = newVariableChildren.concat(varGraph.getExpressionChildren(expr));
          });
          newVariableChildren.forEach(function(child) {
            graph.createEdge(vertex, child);
          });
        }
      };

      this.add = function(vertex, beforeNotifyFn) {
        graph.put(vertex);
        if (beforeNotifyFn) {
          beforeNotifyFn();
        }
        this.updateVariableEdges(vertex);
        vertex.on('change', this.vertexChanged, this);
        this.trigger('vertexAdded', vertex);

        if ((vertex.category === 'geometry') && (!vertex.implicit)) {
          this.layerTree.createGeometryNode(vertex.id);
          graph.setMetadata(this.layerTree.toObj());
          this.layerTree.trigger('change');
        }
      };

      this.remove = function(vertex) {
        graph.remove(vertex);
        vertex.off('change', this.vertexChanged, this);
        this.trigger('vertexRemoved', vertex);

        if ((vertex.category === 'geometry') && (!vertex.implicit)) {
          this.layerTree.removeNode(this.layerTree.findGeomNodeForId(vertex.id));
          graph.setMetadata(this.layerTree.toObj());
          this.layerTree.trigger('change');
        }
      };

      this.replace = function(original, replacement) {
        graph.replace(replacement);
        this.updateVariableEdges(replacement);
        this.setupEventsForReplacement(original, replacement);
      };

      this.notifyAdded = function() {
        graph.leafFirstSearch(function(v) {
          that.trigger('vertexAdded', v);
        });
      };

      this.setupEventsForReplacement = function(original, replacement) {
        original.off('change', this.vertexChanged, this);
        replacement.on('change', this.vertexChanged, this);
        this.trigger('vertexReplaced', original, replacement);
        replacement.trigger('change', replacement);
      };

      this.vertexChanged = function(vertex) {
        var that = this;
        var ancestors = [];
        var findAncestors = function(v) {
          that.parentsOf(v).map(function(parent) {
            ancestors = _.uniq(ancestors.concat(parent));
            findAncestors(parent);
          });
        };
        findAncestors(vertex);
        ancestors.forEach(function(v) {
          v.trigger('change', v);
        });

        // Use a different event here as children beng notified
        // of parent changes is used less, and would also lead to
        // recursive notifications if 'change' was used.
        var notifyChildren = function(v) {
          that.childrenOf(v).map(function(child) {
            try {
              child.trigger('parentChange', child);
            } catch (e) {
              console.warn('exception on child notify: ' + e);
            }
            notifyChildren(child);
          });
        };
        notifyChildren(vertex);
      };

      this.vertexById = function(id) {
        return graph.get(id);
      };

      this.filteredVertices = function(filterFn) {
        return graph.vertices().filter(filterFn);
      };

      this.verticesByType = function(type) {
        return graph.vertices().filter(function(v) {
          return v.type === type;
        });
      };

      this.verticesByCategory = function(category) {
        return graph.vertices().filter(function(v) {
          return v.category === category;
        });
      };

      this.childrenOf = function(vertex) {
        return graph.getOutgoing(vertex);
      };

      this.parentsOf = function(vertex) {
        return graph.getIncoming(vertex);
      };

      this.isEditing = function() {
        return this.getEditingVertices().length > 0;
      };

      this.getEditingVertices = function() {
        return _.reject(graph.vertices(), function(vertex) {
          return !vertex.editing;
        });
      };

      this.createFromHashSerialization = function(hashedGraph, hashesToVertices) {
        geomNode.resetIDCounters();
        this.removeAll();
        graph.fromHashSerialization(hashedGraph, hashesToVertices);
      };

    };

    return {
      Graph: GeometryGraph
    };

  });
