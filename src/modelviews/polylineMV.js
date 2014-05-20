define([
    'jquery',
    'underscore',
    'lib/mustache',
    'calculations',
    'colors',
    'scene',
    'scenevieweventgenerator',
    'worldcursor',
    'geometrygraphsingleton',
    'modelviews/vertexMV',
    'modelviews/geomvertexMV',
    'modelviews/pointMV',
    'modelviews/workplaneMV',
    'asyncAPI',
  ],
  function(
    $,
    _,
    Mustache,
    calc,
    colors,
    sceneModel,
    sceneViewEventGenerator,
    worldCursor,
    geometryGraph,
    VertexMV,
    GeomVertexMV,
    PointMV,
    WorkplaneMV,
    AsyncAPI) {

    // ---------- Common ----------

    var LineSceneView = {

      render: function() {
        GeomVertexMV.EditingSceneView.prototype.render.call(this);

        // Not this.model.vertex as this is view is also used on other models
        var pointChildren = geometryGraph.childrenOf(this.model.polyline);
        if (pointChildren.length === 0) {
          return;
        }
        var coordinates = pointChildren.map(function(point) {
          return point.parameters.coordinate;
        });

        var positions = [calc.objToVector(coordinates[0], geometryGraph, THREE.Vector3)];

        var material = this.model.vertex.editing ?
          this.materials.editing.edge : this.materials.normal.edge;

        for(var i = 1; i < coordinates.length; ++i) {
          var from = calc.objToVector(coordinates[i-1], geometryGraph, THREE.Vector3);
          var to = calc.objToVector(coordinates[i], geometryGraph, THREE.Vector3);
          var geometry = new THREE.Geometry();
          geometry.vertices.push(from);
          geometry.vertices.push(to);
          var line = new THREE.Line(geometry, material);
          this.sceneObject.add(line);
          positions.push(to);
        }

        var pipe = new THREE.Mesh(
          new THREE.PipeGeometry(0.4, positions),
          new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide }));
        this.hiddenSelectionObject.add(pipe);
      },

    };

    // ---------- Editing ----------

    var EditingModel = GeomVertexMV.EditingModel.extend({

      initialize: function(options) {
        this.DOMView = EditingDOMView;
        this.SceneView = EditingLineSceneView;
        GeomVertexMV.EditingModel.prototype.initialize.call(this, options);

        if (this.vertex.implicit) {
          return;
        }

        this.polyline = this.vertex;

        // Create the child models
        if (this.vertex.proto) {
          this.updateHint();
          // Prototype polylines will always have an implicit point as first child
          var pointChildren = geometryGraph.childrenOf(this.vertex);
          this.activePoint = pointChildren[0];
          this.activePoint.active = true;
        } else {
          this.originalImplicitChildren = _.uniq(
            geometryGraph.childrenOf(this.vertex).filter(
              function(v) {
                return v.implicit;
              }));
          this.editingImplicitChildren = this.originalImplicitChildren.map(function(child) {
            return AsyncAPI.edit(child);
          });
        }

      },

      workplanePositionChanged: function(position) {
        if (this.vertex.implicit) {
          return;
        }
        if (this.vertex.proto && this.activePoint) {
          this.activePoint.parameters.coordinate.x = position.x;
          this.activePoint.parameters.coordinate.y = position.y;
          this.activePoint.parameters.coordinate.z = position.z;
          this.activePoint.trigger('change', this.activePoint);
        }
      },

      workplaneClick: function(position) {
        if (this.vertex.implicit) {
          return;
        }

        if (this.vertex.proto) {
          this.addPoint(position);
        } else {
          this.tryCommit();
        }
      },

      workplaneDblClick: function() {
        if (this.vertex.implicit) {
          return;
        }

        if (this.vertex.proto) {
          var children = geometryGraph.childrenOf(this.vertex);
          if (children.length > 2) {
            this.removeLastPoint();
            this.tryCommit();
          }
        }
      },

      sceneViewClick: function(viewAndEvent) {
        if (this.vertex.implicit || (viewAndEvent.view.model.vertex === this.activePoint)) {
          return;
        }

        if (this.vertex.proto) {
          var type = viewAndEvent.view.model.vertex.type;
          if (type === 'point') {

            this.removeLastPoint();
            var clickedPoint = viewAndEvent.view.model.vertex;
            geometryGraph.addPointToParent(this.vertex, clickedPoint);

            // Finish on the first point
            var children = geometryGraph.childrenOf(this.vertex);
            if ((clickedPoint === _.first(children)) && (children.length > 2)) {
              this.tryCommit();
              this.creating = true; // Prevent double create on double click
            } else {
              this.addPoint(clickedPoint.parameters.coordinate);
            }
          } else {
            this.workplaneClick(worldCursor.lastPosition);
          }
        }
      },

      sceneViewDblClick: function(viewAndEvent) {
        if (this.vertex.implicit) {
          return;
        }

        // Double-click on a point and the first click hasn't already created
        if (!this.creating && (viewAndEvent.view.model.vertex.type === 'point')) {
          geometryGraph.removeLastPointFromPolyline(this.vertex);
          this.tryCommit();
        }
      },

      addPoint: function(position) {
        var point = geometryGraph.addPointToParent(this.vertex);
        this.activePoint.active = false;
        this.activePoint = point;
        this.activePoint.active = true;
        this.workplanePositionChanged(position);
        this.updateHint();
      },

      removeLastPoint: function() {
        geometryGraph.removeLastPointFromPolyline(this.vertex);
      },

      updateHint: function() {
        if (this.vertex.proto) {
          var points = geometryGraph.childrenOf(this.polyline).filter(function(v) {
            return (v.type === 'point');
          });
          if (points.length < 3) {
            this.hintView.set('Click to add a corner.');
          } else if (points.length === 3) {
            this.hintView.set('Click to add a corner. Double-click to end.');
          } else {
            this.hintView.set('Click to add a corner. Double-click or click on first corner to end.');
          }
        }
      },

    });

    var EditingDOMView = GeomVertexMV.EditingDOMView.extend({

      render: function() {
        GeomVertexMV.EditingDOMView.prototype.render.call(this);
        var template =
          this.beforeTemplate +
          this.afterTemplate;
        var view = _.extend(this.baseView, {
          radius : this.model.vertex.parameters.radius,
        });
        this.$el.html(Mustache.render(template, view));
        return this;
      },

    });

    var EditingLineSceneView = GeomVertexMV.EditingSceneView.extend(LineSceneView, {});

    // ---------- Display ----------

    var DisplayModel = GeomVertexMV.DisplayModel.extend({

      initialize: function(options) {
        this.SceneView = DisplayLineSceneView;
        GeomVertexMV.DisplayModel.prototype.initialize.call(this, options);
        this.polyline = this.vertex;
      },

    });

    var DisplayLineSceneView = GeomVertexMV.DisplaySceneView.extend(LineSceneView);


    // ---------- Module ----------

    return {
      LineSceneView : LineSceneView,
      EditingModel  : EditingModel,
      DisplayModel  : DisplayModel,
    };

  });
