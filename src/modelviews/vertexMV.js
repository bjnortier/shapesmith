define([
    'jquery',
    'lib/jquery.autoGrowInput',
    'scene',
    'interactioncoordinator',
    'scenevieweventgenerator',
    'selection',
    'geometrygraphsingleton',
    'asyncAPI',
  ], function(
    $, __$,
    sceneModel,
    coordinator,
    sceneViewEventGenerator,
    selection,
    geometryGraph,
    AsyncAPI
  ) {

  // ---------- Common ----------

  var EventProxy = function() {
    _.extend(this, Backbone.Events);
  }

  var eventProxy = new EventProxy();

  var Model = Backbone.Model.extend({

    initialize: function(options) {
      var vertex = options.vertex;

      this.vertex = vertex;
      this.views = [];
      this.inContext = false;
      this.set('selected', selection.isSelected(vertex.id));

      selection.on('selected', this.select, this);
      selection.on('deselected', this.deselect, this);
    },

    destroy: function() {
      this.views.forEach(function(view) {
        view.remove();
      });
      this.views = [];

      selection.off('selected', this.select, this);
      selection.off('deselected', this.deselect, this);
    },  

    addTreeView: function(options) {
      var domView = new this.DOMView(_.extend(options, {model: this}));
      this.views.push(domView);
      return domView;
    },

    addSceneView: function() {
      if (this.sceneView) {
        throw Error('Cannot have multiple scene views');
      }
      this.sceneView = new this.SceneView({model: this});
      this.views.push(this.sceneView);
    },

    select: function(ids, selection) {
      if (ids.indexOf(this.vertex.id) !== -1) {
        this.set('selected', true);
      }
    },

    deselect: function(ids, selection) {
      if (ids.indexOf(this.vertex.id) !== -1) {
        this.set('selected', false);
      }
    },

  });


  var SceneView = Backbone.View.extend({

    initialize: function() {
      this.scene = sceneModel.view.scene;
      this.showStack = 0;
      this.updateCameraScale();
      this.clear();
      sceneModel.view.on('cameraMoveStarted', this.cameraMoveStarted, this);
      sceneModel.view.on('cameraMoved', this.cameraMoved, this);
      sceneModel.view.on('cameraMoveStopped', this.cameraMoveStopped, this);
    },

    remove: function() {
      this.scene.remove(this.sceneObject);
      sceneViewEventGenerator.deregister(this);
      this.removed = true;
      sceneModel.view.updateScene = true;
      sceneModel.view.off('cameraMoveStarted', this.cameraMoveStarted, this);
      sceneModel.view.off('cameraMoved', this.cameraMoved, this);
      sceneModel.view.off('cameraMoveStopped', this.cameraMoveStopped, this);
    },

    renderIfInContext: function() {
      if (this.model.inContext) {
        this.render();
      }
    },

    render: function() {
      this.clear();
    },

    clear: function() {
      // For async renders (e.g. when loading textures), don't render if the 
      // view has been removed
      if (this.removed) {
        return;
      }
      if (this.sceneObject) {
        this.scene.remove(this.sceneObject);
        sceneViewEventGenerator.deregister(this);

        var dispose = function(obj) {

          if (obj.geometry) {
            obj.geometry.dispose();  
          }
          if (obj.material) {
            if (obj.material instanceof THREE.MeshFaceMaterial) {  
              obj.material.materials.forEach(function(obj) {
                obj.dispose();
              });
            } else { 
              // obj.material.dispose(); 
            }
          } 
          if (obj.dispose) {  
            obj.dispose();
          }
          if (obj.children) {
            obj.children.forEach(dispose);
          }
        };
        dispose(this.sceneObject);
      }
      
      this.boundingBox = {
        min: new THREE.Vector3( Infinity, Infinity, Infinity),
        max: new THREE.Vector3( -Infinity, -Infinity, -Infinity),
      }
      var that = this;
      var updateBoundingBox = function(obj) {
        if (obj.geometry) {
          obj.geometry.computeBoundingBox();
          ['x', 'y', 'z'].forEach(function(dim) {
            that.boundingBox.min[dim] = Math.min(
              that.boundingBox.min[dim], 
              obj.geometry.boundingBox.min[dim]);
            that.boundingBox.max[dim] = Math.max(
              that.boundingBox.max[dim], 
              obj.geometry.boundingBox.max[dim]);
            
          })
        }
        if (obj.children && (obj.children.length > 0)) {
          obj.children.map(updateBoundingBox);
        }
      }

      var patchedSceneObject = new THREE.Object3D();
      patchedSceneObject.add = function(child) {
        THREE.Object3D.prototype.add.call(this, child);
        updateBoundingBox(child);
        that.updateScreenBox && that.updateScreenBox(sceneModel.view.camera);
      }

      this.sceneObject = patchedSceneObject;

      // Each scene view has two objects, the one that is part of
      // the scene, and an object that is never added to the scene
      // but is only used for selections. E.g. an edge has cylinders 
      // that are used for selection
      this.hiddenSelectionObject = new THREE.Object3D();
      this.scene.add(this.sceneObject);

      sceneViewEventGenerator.register(this);
      sceneModel.view.updateScene = true;
    },

    isClickable: function() {
      return false;
    },

    isDraggable: function() {
      return false;
    },

    cameraMoveStarted: function() {
    },

    cameraMoved: function() {
      if (this.updateScaledObjects) {
        this.updateCameraScale();
        this.updateScaledObjects();
        sceneModel.view.updateScene = true;
      }
    },

    updateCameraScale: function() {
      var camera = sceneModel.view.camera;
      var cameraDistance = camera.position.length();
      var newScale = cameraDistance/150;
      this.cameraScale = new THREE.Vector3(newScale, newScale, newScale);
    },

    pushShowStack: function() {
      if (this.showStack === 0) {
        this.render();
        this.model.inContext = true;
      }
      ++this.showStack;
    },

    popShowStack: function() {
      if (this.showStack === 0) {
        throw Error('show stack for ' + this.model.vertex.id + ' is zero');
      }
      --this.showStack
      if (this.showStack === 0) {
        this.clear();
        this.model.inContext = false;
      }
    }

  });

  // ---------- Editing ----------

  var EditingModel = Model.extend({

    initialize: function(options) {
      this.originalVertex = options.original;
      Model.prototype.initialize.call(this, options);
      coordinator.on('keyup', this.keyUp, this);
      coordinator.on('containerClick', this.containerClick, this);
    },

    destroy: function() {
      Model.prototype.destroy.call(this);
      coordinator.off('keyup', this.keyUp, this);
      coordinator.off('containerClick', this.containerClick, this);

    },

    // Selecting another vertex will cancel the editing
    // of this one
    deselect: function(ids, selection) {
      Model.prototype.deselect.call(this, ids, selection);
      if (ids.indexOf(this.vertex.id) !== -1) {
        this.cancel();
      }
    },

    tryCommit: function() {
      if (this.parentModel) {
        return this.parentModel.tryCommit();
      }

      var that = this;
      if (this.vertex.proto) {

        var originals = [this.vertex];

        var findImplicitChildren = function(parent) {
          var uniqueImplicitChildren = _.uniq(geometryGraph.childrenOf(parent).filter(function(v) {
            return v.implicit;
          })); 
          originals = originals.concat(uniqueImplicitChildren.concat());
          uniqueImplicitChildren.forEach(findImplicitChildren);
        };
        findImplicitChildren(this.vertex);

        var result = AsyncAPI.tryCommitCreate(originals);
        if (!result.error) {
          var committedVertices = result.newVertices;
          eventProxy.trigger('committedCreate', originals, committedVertices);
          selection.deselectAll();

        }
      } else {
        var originals = [this.originalVertex];
        var editing = [this.vertex];

        if (this.originalImplicitChildren) {
          originals = originals.concat(this.originalImplicitChildren);
          editing = editing.concat(this.editingImplicitChildren);
        }

        var result = AsyncAPI.tryCommitEdit(originals, editing);
        if (!result.error) {
          var committedVertices = result.newVertices;
          eventProxy.trigger('committedEdit', committedVertices);
          selection.deselectAll();
        } 
      }
    },

    tryDelete: function() {
      // Cancel first as the editing state is unknown (i.e. parameter values may have
      // changed and SHA values are unknown
      this.cancel();
      result = AsyncAPI.tryCommitDelete(this.originalVertex);
      eventProxy.trigger('committedDelete');
      selection.deselectAll();
    },

    cancel: function() {
      if (this.vertex.implicit) {
        // handled by parent
        return
      }

      if (this.vertex.proto) {
        var cancelVertices = [this.vertex];
        var findImplicitChildren = function(parent) {
          var uniqueImplicitChildren = _.uniq(geometryGraph.childrenOf(parent).filter(function(v) {
            return v.implicit;
          })); 
          cancelVertices = cancelVertices.concat(uniqueImplicitChildren);
          uniqueImplicitChildren.forEach(findImplicitChildren);
        };
        findImplicitChildren(this.vertex);
        cancelVertices.forEach(function(v) {
          AsyncAPI.cancelCreate(v);
        });
        eventProxy.trigger('cancelledCreate');

      } else {

        var originals = [this.originalVertex];
        var editing = [this.vertex];

        if (this.originalImplicitChildren) {
          originals = originals.concat(this.originalImplicitChildren);
          editing = editing.concat(this.editingImplicitChildren);
        }

        AsyncAPI.cancelEdit(editing, originals);
        eventProxy.trigger('cancelledEdit');
      }

    },

    keyUp: function(event) {
      if (event.keyCode === 27) {
        this.cancel();
        selection.deselectAll();
      }
    },

    deselect: function(ids, selection) {
      Model.prototype.select.call(this, ids, selection);
      if (!this.selected) {
        this.cancel();
      }
    },

  });

  var EditingDOMView = Backbone.View.extend({

    className: 'vertex editing',

    initialize: function() {
      this.model.domView = this;
      this.render();
      this.$el.addClass(this.model.vertex.id);
      if (this.model.vertex.implicit) {
        this.$el.addClass('implicit');
      }
      this.model.vertex.on('change', this.update, this);
    },

    remove: function() {
      Backbone.View.prototype.remove.call(this);
      this.model.vertex.off('change', this.update, this);
    },

    events: function() {
      return {
        'click .field' : 'fieldClick',
        'change .field': 'fieldChange',
        'keyup .field' : 'fieldKeyUp',
        'click .delete': 'delete',
      };
    },

    fieldClick: function(event) {
      event.stopPropagation();
      $('.field').autoGrowInput();
    },

    fieldChange: function(event) {
      event.stopPropagation();
      if (this.updateFromDOM) {
        this.updateFromDOM();
        this.model.vertex.trigger('change', this.model.vertex);
      }
    },

    fieldKeyUp: function(event) {
      event.stopPropagation();

      // Return
      if (event.keyCode === 13) {
        // Webkit Bug https://bugs.webkit.org/show_bug.cgi?id=114745
        this.$el.find('input').blur();
        this.model.tryCommit()
      }
      // Escape
      if (event.keyCode === 27) {
        // Webkit Bug https://bugs.webkit.org/show_bug.cgi?id=114745
        this.$el.find('input').blur();
        this.model.cancel();
      } 
    },

    delete: function() {
      if (this.model.vertex.proto) {
        this.model.cancel();
      } else {
        this.model.tryDelete();
      }
    },

  });

  // ---------- Display ----------

  var DisplayModel = Model.extend({

    initialize: function(options) {
      Model.prototype.initialize.call(this, options);
    },

    tryDelete: function() {
      AsyncAPI.tryCommitDelete(this.vertex);
      selection.deselectAll();
    },

  });

  var DisplayDOMView = Backbone.View.extend({

    initialize: function() {
      this.model.domView = this;
      this.render();
      this.$el.addClass(this.model.vertex.name);  
      this.model.vertex.on('change', this.update, this);
    },

    remove: function() {
      Backbone.View.prototype.remove.call(this);
      this.model.vertex.off('change', this.update, this);
    },

  });

  // ---------- Module ----------


  return {
    eventProxy    : eventProxy,
    Model         : Model,
    SceneView     : SceneView,
    EditingModel  : EditingModel,
    EditingDOMView: EditingDOMView,
    DisplayModel  : DisplayModel,
    DisplayDOMView: DisplayDOMView
  }

});