define([
    'backbone',
    'underscore',
    'jquery',
    'lib/mustache',
    'calculations',
    'modelviews/vertexMV',
    'asyncAPI',
    'commandstack',
    'geometrygraphsingleton',
    'layers/layertreedragdropmixin',
  ], function(
    Backbone,
    _,
    $,
    Mustache,
    calc,
    VertexMV,
    AsyncAPI,
    commandStack,
    geometryGraph,
    DragDropMixin) {

    var layerTree = geometryGraph.layerTree;

    var DisplayModel = Backbone.Model.extend({

      initialize: function() {
        layerTree.on('change', this.updateLayerTree, this);
        VertexMV.eventProxy.on('geometryDragStarted', this.geometryDragStarted, this);
        this.view = new RootDisplayView({model: this});
      },

      destroy: function() {
        layerTree.off('change', this.updateLayerTree, this);
      },

      geometryDragStarted: function(view) {
        this.dragSrcView = view;
      },

      updateLayerTree: function() {
        this.view.updateChildren();
      },

    }).extend(DragDropMixin);

    var updateChildren = function(container, view) {
      if (!view.childViews) {
        view.childViews = {};
      }

      // List of views to remove
      var toRemove = _.keys(view.childViews);

      // Create new views or update existing views
      container.getChildren().forEach(function(child) {
        var childView = view.childViews[child.id];
        if (childView) {
          // Don't remove this view
          toRemove.splice(toRemove.indexOf(child.id), 1);

          // Update children of nested containers
          if (childView.container) {
            childView.container = child;
            childView.updateChildren();
          }

        } else {
          if (child.type !== 'geometry') {
            view.childViews[child.id] = new ContainerDisplayView({
              model: view.model,
              parentView: view,
              container: child,
            });
          } else {
            // Find the view for the vertex and move it into the container
            // Some vertices like implicit points don't have models, so ignore
            // them
            var model = VertexMV.getDisplayOrEditingModelForVertexWithId(child.id);
            if (model && model.domView) {
              view.childViews[child.id] = model.domView;
              view.$el.append(model.domView.$el);
              model.domView.delegateEvents();
            }
          }
        }

      });

      // Remove container views that are no longer children
      toRemove.forEach(function(id) {
        if (view.childViews[id].container) {
          view.childViews[id].remove();
        }
        delete view.childViews[id];
      });

      // Sort the child views to the same order as the tree children
      container.getChildren().forEach(function(child, i) {
        var childView = view.childViews[child.id];
        if (childView) {
          var index = childView.$el.index();
          if (index !== (i + 1)) {
            $(view.$el.children()[i + 1]).insertBefore(childView.$el);
            childView.delegateEvents();
          }
        }
      });

    };

    var RootDisplayView = Backbone.View.extend({

      initialize: function() {
        this.$el = $('#geometry');
        this.updateChildren();
      },

      updateChildren: function() {
        updateChildren(layerTree, this);
      },

    });

    var ContainerDisplayView = Backbone.View.extend({

      className: 'layer-container',

      initialize: function(attributes) {
        this.parentView = attributes.parentView;
        this.container = attributes.container;
        this.render();
        this.parentView.$el.append(this.$el);

        $.data(this.$el[0], 'cid', this.cid);
        $.data(this.$el.find('.icon24')[0], 'cid', this.cid);

        this.updateChildren();
      },

      render: function() {
        var view = {
          id  : this.container.id,
          name: this.container.name,
          type: this.container.type,
        };
        var template =
          '<div class="title {{id}}" draggable="true">' +
          '<div class="icon24 {{type}}"></div>' +
          '<div class="name">{{name}}</div>' +
          '<div class="delete"></div>' +
          '<div>';
        this.$el.html(Mustache.render(template, view));
      },

      updateChildren: function() {
        updateChildren(this.container, this);
      },

      events: {
        'dragstart'   : 'dragstart',
        'dragenter'   : 'dragenter',
        'dragleave'   : 'dragleave',
        'dragover'    : 'dragover',
        'dragend'     : 'dragend',
        'drop'      : 'drop',
        'click .delete' : 'delete',
      },

      delete: function() {
        var that = this;
        this.model.commitLayerTree(function() {
          return layerTree.removeNode(that.container);
        });
      },

      dragstart: function(event) {
        event.stopPropagation();
        // Firefox requires data in the drag
        event.originalEvent.dataTransfer.effectAllowed = 'move';
        event.originalEvent.dataTransfer.setData('text/plain','dummy value');
        this.model.dragSrcView = this;
      },

      // We keep count of the number of enter events,
      // since moving fomr the div into the image will generate
      // one leave and one enter event, and we want to keep
      // the drop highlight
      dragenter: function(event) {
        event.stopPropagation();

        if (this.enterEventCount === undefined) {
          this.enterEventCount = 0;
        }
        ++this.enterEventCount;

      },

      dragleave: function(event) {
        event.stopPropagation();

        --this.enterEventCount;
        if (this.enterEventCount === 0) {
          this.$el.removeClass('validChildDropTarget');
          this.$el.removeClass('validSiblingBeforeDropTarget');
          this.$el.removeClass('validSiblingAfterDropTarget');
        }
      },

      dragover: function(event) {
        event.stopPropagation();
        event.preventDefault();
        event.originalEvent.dataTransfer.dropEffect = 'move';

        var height = $(event.target).height();

        this.$el.removeClass('validChildDropTarget');
        this.$el.removeClass('validSiblingBeforeDropTarget');
        this.$el.removeClass('validSiblingAfterDropTarget');
        calc.addOffset($(event.target), event.originalEvent);
        if (event.originalEvent.offsetY < 7) {
          if (this.isValidSiblingDrop(this.model.dragSrcView, this)) {
            this.$el.removeClass('validSiblingAfterDropTarget');
            this.$el.addClass('validSiblingBeforeDropTarget');
          }
        } else if (event.originalEvent.offsetY > height - 7) {
          if (this.isValidSiblingDrop(this.model.dragSrcView, this)) {
            this.$el.addClass('validSiblingAfterDropTarget');
            this.$el.removeClass('validSiblingBeforeDropTarget');
          }
        } else {
          if (this.isValidChildDrop(this.model.dragSrcView, this)) {
            this.$el.addClass('validChildDropTarget');
          }
        }

        return false;
      },

      dragend: function(event) {
        event.stopPropagation();
        this.$el.removeClass('validChildDropTarget');
        this.$el.removeClass('validSiblingAfterDropTarget');
        this.$el.removeClass('validSiblingBeforeDropTarget');
        this.enterEventCount = 0;
      },

      drop: function(event) {
        event.stopPropagation();
        event.preventDefault();

        var node = (this.model.dragSrcView.container ||
              this.model.createOrGetGeomNode(this.model.dragSrcView.model.vertex.id));
        if (this.$el.hasClass('validChildDropTarget')) {
          this.model.moveInto(node, this.container);
        } else if (this.$el.hasClass('validSiblingBeforeDropTarget')) {
          this.model.moveFirstBeforeSecond(node, this.container);
        } else if (this.$el.hasClass('validSiblingAfterDropTarget')) {
          this.model.moveFirstAfterSecond(node, this.container);
        }

        this.$el.removeClass('validChildDropTarget');
        this.$el.removeClass('validSiblingBeforeDropTarget');
        this.$el.removeClass('validSiblingAfterDropTarget');
        this.enterEventCount = 0;
        this.model.dragSrcView = undefined;
      },

      isValidChildDrop: function(source, target) {
        if (source === target) {
          return false;
        }
        if (source.container && target.container) {
          var sourceType = source.container.type;
          var targetType = target.container.type;
          return (((sourceType === 'storey') && (targetType === 'building')) ||
              ((sourceType === 'zone') && (targetType === 'storey')));
        }
        if (source.model.vertex && target.container) {
          return true;
        }
        return false;
      },

      isValidSiblingDrop: function(source, target) {
        if (source === target) {
          return false;
        }
        if (source.container && target.container) {
          var sourceType = source.container.type;
          var targetType = target.container.type;
          return ((source !== target) && (sourceType === targetType));
        }
        if (source.model.vertex) {
          return true;
        }
      },

    });

    return {
      DisplayModel: DisplayModel,
    };

  });
