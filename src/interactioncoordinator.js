define([
    'jquery',
    'lib/jquery.mousewheel',
    'underscore',
    'backbone',
    'geometrygraphsingleton',
    'calculations',
    'scenevieweventgenerator'
  ],
  function($, __$, _, Backbone, geometryGraph, calc, sceneViewEventGenerator) {

    var Coordinator = function() {
      _.extend(this, Backbone.Events);

      var dragThreshold = 10;
      var dragging = false;

      var that = this;
      window.addEventListener('keyup', function(event) {
        that.trigger('keyup', event);
      }, false);

      $(window).blur(function(event) {
        that.trigger('windowBlur', event);
      });


      $('#scene canvas').mousemove(function(event) {
        calc.addOffset('#scene canvas', event);
        that.mousemove(event);
      });
      $('#scene canvas').mouseup(function(event) {
        calc.addOffset('#scene canvas', event);
        that.trigger('mouseup', event);
        that.mouseup(event);
      });
      $('#scene canvas').dblclick(function(event) {
        calc.addOffset('#scene canvas', event);
        that.dblclick(event);
      });
      $('#scene canvas').mousedown(function(event) {
        calc.addOffset('#scene canvas', event);
        that.trigger('mousedown', event);
        that.mousedown(event);
      });
      $('#scene canvas').mousewheel(function(event) {
        that.trigger('mousewheel', event);
      });
      $('#graphs').click(function(event) {
        that.trigger('containerClick', event);
      });

      this.mousemove = function(event) {
        if (this.overDragThreshold(eventToPosition(event))) {
          event.mouseDownEvent = this.mouseDownEvent;
          dragging = true;
          if (!sceneViewEventGenerator.drag(event)) {
            this.trigger('drag', event);
          }
        } else {
          this.trigger('mousemove', event);
          sceneViewEventGenerator.mousemove(event);
          if (sceneViewEventGenerator.overDraggable()) {
            $('#scene').css('cursor', 'move');
          } else if (sceneViewEventGenerator.overClickable()) {
            $('#scene').css('cursor', 'pointer');
          } else {
            $('#scene').css('cursor', '');
          }
        }
      };

      this.mouseup = function(event) {
        if (!dragging) {

          // Prevent multiple click event on double click
          var now = new Date().getTime();
          var eventPosition = eventToPosition(event);

          var isSecondClickOfDoubleClick = false;
          if (this.lastClickTimestamp) {
            var within500ms = (now - this.lastClickTimestamp < 500);
            var dx = Math.abs(eventPosition.x - this.lastClickPosition .x);
            var dy = Math.abs(eventPosition.y - this.lastClickPosition .y);
            var isWithinThreshold = Math.sqrt(dx*dx + dy*dy) < dragThreshold;
            isSecondClickOfDoubleClick = within500ms && isWithinThreshold;
          }

          this.lastClickTimestamp = now;
          this.lastClickPosition = eventPosition;

          if (!isSecondClickOfDoubleClick) {
            if (sceneViewEventGenerator.overClickable()) {
              sceneViewEventGenerator.click(event);
            } else {
              this.trigger('sceneClick', event);
            }
          }
        }
        sceneViewEventGenerator.mouseup(event);
        this.mouseDownEvent = undefined;
        dragging = false;
      };

      this.dblclick = function(event) {
        // If this wasn't a sceneview double click, generate
        // a noremal double click
        if (!sceneViewEventGenerator.dblclick(event)) {
          this.trigger('sceneDblClick', event);
        }
      };

      this.mousedown = function(event) {
        this.mouseDownEvent = event;
        sceneViewEventGenerator.mousedown(event);
      };

      this.overDragThreshold = function(pos2) {
        if (!this.mouseDownEvent) {
          return false;
        }
        var pos1 = eventToPosition(this.mouseDownEvent);
        var dx = Math.abs(pos1.x - pos2.x);
        var dy = Math.abs(pos1.y - pos2.y);
        return Math.sqrt(dx*dx + dy*dy) > dragThreshold;
      };
    };

    var eventToPosition = function(event) {
      return {
        x: event.offsetX,
        y: event.offsetY,
      };
    };

    return new Coordinator();
  });
