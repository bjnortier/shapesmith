define([
    'jquery',
    'lib/mustache',
    'backbone',
    'scene',
    'selection',
    'geometrygraphsingleton',
    'asyncAPI',
    'modelviews/modelgraph',
  ], function(
    $,
    Mustache,
    Backbone,
    sceneModel,
    selection,
    geometryGraph,
    AsyncAPI,
    modelGraph) {

      var Model = Backbone.Model.extend({

        initialize: function() {
          // selection.on('selected', this.updateActionsView, this);
          // selection.on('deselected', this.updateActionsView, this);
        },

        updateActionsView: function(_, selection) {
          this.geometryVertices = selection.map(function(id) {
            return geometryGraph.vertexById(id);
          }).filter(function(v) {
            return (v.category === 'geometry');
          });

          if (this.geometryVertices.length) {
            if (!this.view) {
              this.view = new View({model: this});
            }
            this.geomVertexModels = this.geometryVertices.map(function(v) {
              return modelGraph.get(v.id);
            });
            this.view.update();
          } else if (this.view) {
            this.view.remove();
            delete this.view;
            this.geomVertexModels = [];
            this.geometryVertices = [];
          }
        },

      });

      var View = Backbone.View.extend({

        className: 'materials',

        initialize: function() {
          this.render();
          this.optionsElement = this.$el.find('.options');
          this.optionsElement.hide();
          this.optionsElement.addClass('hidden');
          $('#scene').append(this.$el);

          sceneModel.view.on('cameraMoveStarted', this.hide, this);

          // Using the after: event since the geometry screen box is updated
          // on move stop, and use that screenbox in some overlay views
          sceneModel.view.on('after:cameraMoveStopped', this.show, this);
        },

        remove: function() {
          Backbone.View.prototype.remove.call(this);

          sceneModel.view.off('cameraMoveStarted', this.hide, this);
          sceneModel.view.off('after:cameraMoveStopped', this.show, this);
        },

        render: function() {
          var template =
            '<div class="title">COLORS...</div>' +
            '<div class="options">' +
              '<div class="colors">{{#colors}}' +
                '<div class="color" data-color="{{hex}}" style="background-color:{{hex}}"></div>' +
              '{{/colors}}</div>' +
            '<div>';
          var view = {
            colors: [
              {hex: '#ffffff'},
              {hex: '#6690cf'},
              {hex: '#e6271c'},
              {hex: '#6cbe32'},
              {hex: '#f2f377'},
              {hex: '#888888'},
            ],
          };
          this.$el.html(Mustache.render(template, view));
        },

        update: function() {
          var sceneObjects = this.model.geomVertexModels.reduce(function(acc, model) {
            if (model.sceneView) {
              acc.push(model.sceneView.sceneObject);
            }
            return acc;
          }, []);
          var screenBox = new THREE.Box2();
          sceneObjects.forEach(function(sceneObject) {
            var findMaxBox = function(obj) {
              if (obj.screenBox) {
                screenBox.union(obj.screenBox);
              }
              if (obj.children.length > 0) {
                obj.children.map(findMaxBox);
              }
            };
            findMaxBox(sceneObject);
          });
          this.$el.css('left', Math.max((screenBox.max.x + screenBox.min.x)/2 - this.$el.width()/2), 0);
          this.$el.css('top',  Math.max(screenBox.min.y - this.$el.height() - 30, 0));
        },

        events: {
          'click .title'   : 'titleClick',
          'click .color'   : 'selectColor',
        },

        titleClick: function() {
          if (this.optionsElement.hasClass('hidden')) {
            this.optionsElement.show();
            this.optionsElement.removeClass('hidden');
          } else {
            this.optionsElement.hide();
            this.optionsElement.addClass('hidden');
          }
        },

        selectColor: function(event) {
          var newVertices = this.model.geometryVertices.map(function(v) {
            var v2 = v.cloneNonEditing();
            v2.parameters.material = {
              color: $(event.target).data('color')
            };
            return v2;
          });
          selection.deselectAll();
          AsyncAPI.tryCommitReplace(this.model.geometryVertices, newVertices);
        },

        show: function() {
          this.update();
          this.$el.show();
        },

        hide: function() {
          this.$el.hide();
        },

      });

      return new Model();

    });
