define([
    'underscore',
    'backbone-events',
    'calculations',
    'scene',
    'geometrygraphsingleton',
    'scenevieweventgenerator',
    'modelviews/vertexMV',
    'settings',
    'modelviews/currentworkplane'
  ], function(_,
    Events,
    calc,
    sceneModel,
    geometryGraph,
    sceneViewEventGenerator,
    VertexMV,
    userSettings,
    currentWorkplane) {

    var camera = sceneModel.view.camera;
    var snapSettingsOverride;

    var getPositionForEvent = function(event, facePosition, edgePosition) {

      var settings = snapSettingsOverride || userSettings;

      var workplanePosition = getPositionOnWorkplane(event);
      if (settings.get('snapedges') && edgePosition) {
        return edgePosition;
      } else if (settings.get('snapfaces') && facePosition) {
        return facePosition;
      } else if (settings.get('snapgrid')) {
        return round(workplanePosition, currentWorkplane.getGridSize());
      } else {
        return round(workplanePosition, 0.001);
      }
    };

    var getPositionOnWorkplane = function(event) {
      var workplaneModel = currentWorkplane.get();
      return calc.positionOnWorkplane(
        $('#scene'), event, workplaneModel.vertex, geometryGraph, camera);
    };

    var round = function(position, grid) {
      return new THREE.Vector3(
        Math.round(position.x/grid) * grid,
        Math.round(position.y/grid) * grid,
        Math.round(position.z/grid) * grid);
    };

    // ---------- Observer ----------

    function Observer() {

      _.extend(this, Events);

      this.workplaneOrFacePositionChanged = function(event, facePosition, edgePosition) {
        var newPosition = getPositionForEvent(event, facePosition, edgePosition);
        if (newPosition) {
          if (!this.lastPosition || !this.lastPosition.equals(newPosition)) {
            this.trigger('positionChanged', newPosition, event);
          }
          this.lastPosition = newPosition;
        }
      };

      this.workplaneClick = function() {
        if (this.lastPosition) {
          this.trigger('click', this.lastPosition);
        }
      };

      this.workplaneDblClick = function() {
        if (this.lastPosition) {
          this.trigger('dblclick', this.lastPosition);
        }
      };

      this.sceneViewDragStarted = function(intersection, event, facePosition, edgePosition) {
        var newPosition = getPositionForEvent(event, facePosition, edgePosition);
        if (newPosition) {
          intersection.view.trigger('dragStarted', newPosition, intersection, event);
        }
      };

      this.sceneViewDrag = function(intersection, event, facePosition, edgePosition) {
        var newPosition = getPositionForEvent(event, facePosition, edgePosition);
        if (newPosition) {
          if (!this.lastDragPosition || !this.lastDragPosition.equals(newPosition)) {
            intersection.view.trigger('drag', newPosition, intersection, event);
          }
          this.lastDragPosition = newPosition;
        }
      };

      this.overrideSnapping = function(settings) {
        if (settings) {
          // Mimic the model
          snapSettingsOverride = {
            get: function(key) {
              return settings[key];
            }
          };
        } else {
          snapSettingsOverride = undefined;
        }
      };

      // Register for events after the document is loaded and the workplane exists
      this.registerEvents = function() {
        VertexMV.eventProxy.on('workplanePositionChanged', this.workplaneOrFacePositionChanged, this);
        VertexMV.eventProxy.on('workplaneClick', this.workplaneClick, this);
        VertexMV.eventProxy.on('workplaneDblClick', this.workplaneDblClick, this);
        VertexMV.eventProxy.on('overrideSnapping', this.overrideSnapping, this);


        sceneViewEventGenerator.on('positionChanged', this.workplaneOrFacePositionChanged, this);
        sceneViewEventGenerator.on('dragStarted', this.sceneViewDragStarted, this);
        sceneViewEventGenerator.on('drag', this.sceneViewDrag, this);
      };

    }
    return new Observer();

  });
