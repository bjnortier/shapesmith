define([
    'backbone',
    'calculations',
    'scene',
    'geometrygraphsingleton',
    'interactioncoordinator',
    'modelviews/overlaydomview',
  ],
  function(Backbone, calc, sceneModel, geometryGraph, coordinator, OverlayDOMView) {

    var View = OverlayDOMView.extend({

      initialize: function() {
        this.render();
        $('#scene').append(this.$el);
        this.update();
        OverlayDOMView.prototype.initialize.call(this);
      },

      remove: function() {
        OverlayDOMView.prototype.remove.call(this);
      },

      update: function() {
        this.render();
        var camera = sceneModel.view.camera;
        var sceneWidth = $('#scene').innerWidth();
        var sceneHeight = $('#scene').innerHeight();

        // Apply Workplane
        var globalPosition;
        if (this.isGlobal) {
          globalPosition = this.localPosition;
        } else {
          var workplaneOrigin = calc.objToVector(
            this.model.vertex.workplane.origin,
            geometryGraph,
            THREE.Vector3);
          var workplaneAxis =  calc.objToVector(
            this.model.vertex.workplane.axis,
            geometryGraph,
            THREE.Vector3);
          var workplaneAngle = geometryGraph.evaluate(this.model.vertex.workplane.angle);

          globalPosition = calc.rotateAroundAxis(this.localPosition, workplaneAxis, workplaneAngle);
          globalPosition.add(workplaneOrigin);
        }

        var screenPos = calc.toScreenCoordinates(sceneWidth, sceneHeight, camera, globalPosition);

        this.$el.css('left', (screenPos.x + 10) + 'px');
        this.$el.css('top',  (screenPos.y - 10) + 'px');
      },

      events: {
        'mousemove' : 'mousemove',
        'mousedown' : 'mousedown',
        'mouseup'   : 'mouseup',
      },

      mousemove: function(event) {
        calc.addOffset('#scene canvas', event);
        coordinator.mousemove(event);
      },

      mousedown: function(event) {
        calc.addOffset('#scene canvas', event);
        coordinator.mousedown(event);
      },

      mouseup: function(event) {
        calc.addOffset('#scene canvas', event);
        coordinator.mouseup(event);
      },

    });

    return View;
  });
