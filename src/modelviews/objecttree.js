// The object tree is a tree-like interface to the geometry graph. Trees are much
// easier to display and interact with than graphs, since they are simple
// collapsable hierarchies.
//
// Representing a graph (a DAG to be exact) using trees leads to redundancy -
// a vertex in the graph can be represented by more than one node in the tree.
//
// The graph tree keeps track, in a non-durable way, of which nodes have been
// drilled down to.
//
// Rules:
//   1. Each vertex in the graph that has no parents and is not implicit
//      will have a tree.
//   2. Vertices in the graph that are shared between more than one resulting
//      tree will have multiple tree views

define([
    'underscore',
    'geometrygraphsingleton',
    'modelviews/modelgraph'
  ],
  function(
    _,
    geometryGraph,
    models) {

    var trees = [];

    // A tree node
    var Node = function(vertex, model, domView, children) {
      this.vertex = vertex;
      this.model = model;
      this.domView = domView;
      this.children = children || [];

      this.children.forEach(function(child) {
        child.parent = this;
      });

      this.dive = function() {
        // this.domView.$el.find('> .children').show();
        this.children.forEach(function(child) {
          child.showInScene();
        });
        this.hideInScene();
      };

      this.ascend = function() {
        this.showInScene();

        var ascendChildren = function(node) {
          node.children.forEach(function(child) {
            ascendChildren(child);
            if (!child.vertex.implicit) {
              if (!child.model.inContext) {
                child.model.domView.ascend();
              } else if (child.model.inContext) {
                child.hideInScene();
              }
            }

          });
        };
        ascendChildren(this);
      };

      // Listen to dive/ascend events from the domview
      this.__defineSetter__('domView', function(domView) {
        if (this._domView) {
          this._domView.off('dive', this.dive, this);
          this._domView.off('ascend', this.ascend, this);
        }
        this._domView = domView;
        this._domView.on('dive', this.dive, this);
        this._domView.on('ascend', this.ascend, this);
      });

      this.__defineGetter__('domView', function() {
        return this._domView;
      });

      this.domView = domView;
    };

    // Hide the node in the scene - includes hiding
    // scene views of implicit children
    Node.prototype.hideInScene = function() {
      this.model.sceneView.popShowStack();
      this.children.forEach(function(childNode) {
        if (childNode.vertex.implicit) {
          childNode.hideInScene();
        }
      });
    };

    Node.prototype.showInScene = function() {
      this.model.sceneView.pushShowStack();
      this.children.forEach(function(childNode) {
        if (childNode.vertex.implicit) {
          childNode.showInScene();
        }
      });
    };

    Node.prototype.findVertex = function(vertex) {
      var found = [];
      if (vertex.id === this.vertex.id) {
        found.push(this);
      }
      this.children.forEach(function(child) {
        found = found.concat(child.findVertex(vertex));
      });
      return found;
    };

    Node.prototype.remove = function() {
      this.children.forEach(function(child) {
        child.remove();
      });
      this.domView.off('dive', this.dive, this);
      this.domView.off('ascend', this.ascend, this);
    };

    // ---------- Observe the models ----------

    models.on('added', function(vertex, model) {
      if (vertex.category === 'geometry') {
        if (shouldHaveTree(vertex)) {
          trees.push(createTree(vertex, $('#geometry')));

        } else if (vertex.implicit) {

          // Implicit vertices will be added as children to all
          // parent nodes. This happens during editing when a new
          // point is added
          var parentVertices = geometryGraph.parentsOf(vertex);
          var parentNodes = [];
          parentVertices.forEach(function(parentVertex) {
            trees.forEach(function(tree) {
              parentNodes = parentNodes.concat(tree.findVertex(parentVertex));
            });
          });
          parentNodes.forEach(function(parentNode) {
            var parentDomElement = parentNode.domView.$el.find('.children.' + parentNode.vertex.id);
            parentNode.children.push(createTree(vertex, parentDomElement));
          });
        }
      } else {
        if (model.sceneView) {
          model.sceneView.pushShowStack();
        }
      }

    });

    models.on('removed', function(vertex) {
      if (vertex.category === 'geometry') {
        trees = trees.reduce(function(acc, root) {
          root.findVertex(vertex).forEach(function(node) {
            node.remove();
          });
          if (root.vertex.id === vertex.id) {
            return acc;
          } else {
            return acc.concat(root);
          }
        }, []);

        // If any of the children of the removed vertex should now be trees,
        // create them
        var geomVerticesWithoutTrees = geometryGraph.filteredVertices(function(v) {
          var isGeom = (v.category === 'geometry');
          var hasTree = _.find(trees, function(t) {
            return t.vertex.id === v.id;
          });
          return isGeom && !hasTree;
        });
        geomVerticesWithoutTrees.forEach(function(v) {
          if (shouldHaveTree(v)) {
            trees.push(createTree(v, $('#geometry')));
          }
        });
      }
    });

    models.on('replaced', function(original, originalModel, replacement, replacementModel) {
      if (original.category === 'geometry') {
        // Find the nodes in the tree representing the vertex and replace
        // with the new model
        var nodes = [];
        trees.forEach(function(node) {
          nodes = nodes.concat(node.findVertex(original));
        });
        nodes.forEach(function(node) {

          node.model = replacementModel;

          var replaceDomElement = node.domView.$el;
          var newDOMView = replacementModel.addTreeView({replaceDomElement: replaceDomElement});
          var oldChildrenElement = newDOMView.$el.find('> .children.' + original.id);
          var newChildrenElement = node.domView.$el.find('> .children,' + replacement.id);
          oldChildrenElement.replaceWith(newChildrenElement);

          var redelegateChildren = function(n) {
            n.children.forEach(function(child) {
              child.domView.delegateEvents();
              redelegateChildren(child);
            });
          };
          redelegateChildren(node);

          node.domView = newDOMView;
        });
      }
    });

    // Doesn't the vertex have a tree?
    var shouldHaveTree = function(vertex) {
      return !vertex.implicit && !geometryGraph.parentsOf(vertex).length;
    };

    var createTree = function(vertex, domElement) {
      var model = models.get(vertex.id);
      var domView = model.addTreeView({appendDomElement: domElement});
      var childrenPlaceholder = domView.$el.find('> .children.' + vertex.id);
      var node = new Node(
        vertex,
        model,
        domView,
        geometryGraph.childrenOf(vertex).reduce(function(acc, child) {
          // Ignore non-geometry childre, e.g. variables
          if (child.category === 'geometry') {
            // Look for existing trees that should become children, e.g.
            // when a boolean is created
            var foundTree = _.find(trees, function(t) {
              return (t.vertex.id === child.id);
            });
            if (foundTree) {
              trees.splice(trees.indexOf(foundTree), 1);
              childrenPlaceholder.append(foundTree.domView.$el);
              foundTree.domView.delegateEvents();
              foundTree.hideInScene();
              return acc.concat(foundTree);
            } else {
              var childTree = createTree(child, childrenPlaceholder);
              childTree.hideInScene();
              return acc.concat(childTree);
            }
          } else {
            return acc;
          }
        }, [])
      );
      node.showInScene();
      return node;
    };

    return {
      getTopLevelModels: function() {
        return trees.map(function(node) {
          return node.model;
        });
      }
    };

  });
