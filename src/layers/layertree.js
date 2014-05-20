define(['underscore', 'backbone-events'], function(_, Events) {

  var GeometryNode = function(id) {

    this.type   = 'geometry';
    this.id   = id;

    this.toObj = function() {
      return {
        type : 'geometry',
        id   : this.id,
      };
    };
  };

  var Container = function(type, namerOrName) {

    this.type = type;
    this.name = typeof(namerOrName) === 'function'  ? namerOrName(type) : namerOrName;
    this.id = this.name;

    var children = [];

    this.add = function(node) {
      children.push(node);
    };

    this.insertBefore = function(node, target) {
      var index = children.indexOf(target);
      if (index === -1) {
        throw new Error('node not found: ' + (target.name ? target.name : target.id));
      }
      children.splice(index, 0, node);
    };

    this.insertAfter = function(node, target) {
      var index = children.indexOf(target);
      if (index === -1) {
        throw new Error('node not found: ' + (target.name ? target.name : target.id));
      }
      children.splice(index + 1, 0, node);
    };

    this.detach = function(node) {
      var index = children.indexOf(node);
      if (index === -1) {
        throw new Error('node not found: ' + (node.name ? node.name : node.id));
      }
      children.splice(index, 1);
    };

    this.remove = function(node) {
      // Prevent removal of a container that has child containers
      var hasGrandchildren = (node.getChildren && _.any(node.getChildren(), function(child) {
        return child.getChildren;
      }));
      if (hasGrandchildren) {
        return false;
      }

      this.detach(node);

      // Move grand children one level up
      var grandChildren = node.getChildren ? node.getChildren() : [];
      children = children.concat(grandChildren);
      return true;

    };

    this.getChildren = function() {
      return children.slice(0);
    };

    this.toObj = function() {
      var childrenObj = children.map(function(child) {
        return child.toObj();
      });
      return {
        type   : this.type,
        name   : this.name,
        children : childrenObj
      };
    };

    this.fromObj = function(obj) {
      children = [];
      for(var i = 0; i < obj.length; ++i) {
        if (obj[i].type === 'geometry') {
          children[i] = new GeometryNode(obj[i].id);
        } else {
          children[i] = new Container(obj[i].type, obj[i].name);
          children[i].fromObj(obj[i].children);
        }
      }
      return this;
    };

    this.findContainer = function(node) {
      var index = children.indexOf(node);
      if (index !== -1) {
        return this;
      } else {
        for (var i = 0; i < children.length; ++i) {
          if (children[i].findContainer) {
            var possibleContainer = children[i].findContainer(node);
            if (possibleContainer) {
              return possibleContainer;
            }
          }
        }
        return undefined;
      }
    };

    this.findContainerById = function(id) {
      if (this.id === id) {
        return this;
      }

      var children = this.getChildren();
      var found;
      for (var i = 0; (i < children.length) && (!found); ++i) {
        found = children[i].findContainerById && children[i].findContainerById(id);
      }
      return found;
    };

    this.findGeomNode = function(id) {
      for (var i = 0; i < children.length; ++i) {
        if ((children[i].type === 'geometry') && (children[i].id === id)) {
          return children[i];
        } else if (children[i].findGeomNode) {
          var foundInChildren = children[i].findGeomNode(id);
          if (foundInChildren) {
            return foundInChildren;
          }
        }
      }
      return undefined;
    };

    this.findAndRemove = function(node) {
      var container = this.findContainer(node);
      if (container) {
        return container.remove(node);
      } else {
        return false;
      }
    };

    this.findAndDetach = function(node) {
      var container = this.findContainer(node);
      if (container) {
        container.detach(node);
        return true;
      } else {
        return false;
      }
    };
  };

  var RootContainer = function() {
    Container.prototype.constructor.call(this, 'root', function() {
      return 'root';
    });

    this.toObj = function() {
      return this.getChildren().map(function(child) {
        return child.toObj();
      });
    };

  };

  var Tree = function() {

    _.extend(this, Events);
    var counters = {};

    var root = new RootContainer();

    this.toObj = function() {
      return root.toObj();
    };

    this.clear = function() {
      root = new RootContainer();
      counters = {};
    };

    this.fromObj = function(obj) {
      root = new RootContainer().fromObj(obj || []);
      counters = {};
    };

    var that = this;
    this.namer = function(type) {
      if (counters[type] === undefined) {
        counters[type] = 1;
      }
      var exists;
      var name;
      do {
        name = type + counters[type];
        counters[type] = counters[type] + 1;
        exists = that.findContainerById(name) !== undefined;
      } while(exists);
      return name;
    };

    this.createContainer = function(type) {
      var node = new Container(type, this.namer);
      root.add(node);
      return node;
    };

    this.createGeometryNode = function(id) {
      var node = new GeometryNode(id);
      root.add(node);
      return node;
    };

    // Move the node into the container
    this.moveInto = function(node, container) {
      var found = root.findAndDetach(node);
      if (!found) {
        throw new Error('node not found in tree');
      }
      container.add(node);
    };

    // Move before another node on the same level
    this.moveFirstBeforeSecond = function(node, target) {
      root.findAndDetach(node);
      var container = root.findContainer(target);
      container.insertBefore(node, target);
    };

    // Move after another node on the same level
    this.moveFirstAfterSecond = function(node, target) {
      root.findAndDetach(node);
      var container = root.findContainer(target);
      container.insertAfter(node, target);
    };

    this.getChildren = function() {
      return root.getChildren();
    };

    this.findGeomNodeForId = function(id) {
      return root.findGeomNode(id);
    };

    this.removeNode = function(node) {
      return root.findAndRemove(node);
    };

    this.findContainerById = function(id) {
      return root.findContainerById(id);
    };
  };

  return Tree;

});
