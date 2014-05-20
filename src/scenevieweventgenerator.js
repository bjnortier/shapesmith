define(['underscore', 'backbone', 'calculations', 'scene', 'geometrygraphsingleton'],
  function(_, Backbone, calc, sceneModel, geometryGraph) {

    var EventGenerator = function() {
      _.extend(this, Backbone.Events);
      var sceneViews = [],
        mouseOverViews = [],
        firstMouseOverView,
        mouseDownOnDraggableIntersections = [],
        mouseIsDown = false,
        dragging = false;

      this.register = function(sceneView) {
        var index = sceneViews.indexOf(sceneView);
        if (index !== -1) {
          throw new Error('Scene view already in event generator');
        }
        sceneViews.push(sceneView);

      };

      this.deregister= function(sceneView) {
        var index = sceneViews.indexOf(sceneView);
        if (index === -1) {
          throw new Error('Scene view not found in event generator');
        }
        sceneViews.splice(index, 1);
      };

      this.replaceInDraggable = function(previous, id) {
        if ((mouseDownOnDraggableIntersections[0]) &&
          (mouseDownOnDraggableIntersections[0].view.model.vertex) &&
          (mouseDownOnDraggableIntersections[0].view.model.vertex.id === id)) {

          sceneViews.forEach(function(view) {
            if (view.model.vertex && (view.model.vertex.id === id)) {
              mouseDownOnDraggableIntersections[0].view = view;
            }
          });
        }
      };

      this.mousedown = function(event) {
        var intersectionsForEvent = this.findFaceIntersections(event);
        mouseDownOnDraggableIntersections = intersectionsForEvent.filter(function(intersection) {
          return intersection.view.isDraggable();
        });
        mouseIsDown = true;
      };

      this.mouseup = function(event) {
        if ((mouseDownOnDraggableIntersections.length > 0) && (dragging)) {
          mouseDownOnDraggableIntersections[0].view.trigger('dragEnded', event);
        }
        mouseDownOnDraggableIntersections = [];
        mouseIsDown = false;
        dragging = false;
      };

      this.mousemove = function(event) {
        var previousOverObjects = mouseOverViews.slice(0);
        var leaveObjects = mouseOverViews.slice(0);

        mouseOverViews = [];
        var intersections = this.findFaceIntersections(event);
        var viewsForEvent = _.uniq(_.pluck(intersections, 'view'));

        if (firstMouseOverView) {
          // Already a first view - if not the same, trigger a leave
          if (viewsForEvent[0] !== firstMouseOverView) {
            firstMouseOverView.trigger('mouseleavefirst');
            if (viewsForEvent[0]) {
              viewsForEvent[0].trigger('mouseenterfirst', intersections[0]);
            }
          }
        } else {
          if (viewsForEvent[0]) {
            viewsForEvent[0].trigger('mouseenterfirst', intersections[0]);
          }
        }
        if (viewsForEvent[0]) {
          viewsForEvent[0].trigger('mousemove', intersections[0]);
        }
        firstMouseOverView = viewsForEvent[0];

        viewsForEvent.map(function(view) {
          if (previousOverObjects.indexOf(view) === -1) {
            view.trigger('mouseenter');
          }
          mouseOverViews.push(view);
          var index = leaveObjects.indexOf(view);
          if (index !== -1) {
            leaveObjects.splice(index, 1);
          }
        });
        leaveObjects.map(function(view) {
          var index = sceneViews.indexOf(view);
          if (index !== -1) {
            view.trigger('mouseleave');
          }
        });

        // Ignore any editing intersections
        var faceIntersections = intersections.filter(function(intersection) {
          return !intersection.view.model.vertex || !intersection.view.model.vertex.editing;
        });
        var closestEdgePosition;
        if (geometryGraph.isEditing()) {
          closestEdgePosition = this.findClosestNonEditingEdge(event);
        }
        this.trigger(
          'positionChanged',
          event,
          faceIntersections[0] && faceIntersections[0].position,
          closestEdgePosition);

      };

      this.drag = function(event) {
        if (mouseDownOnDraggableIntersections.length > 0) {
          var intersections = this.findFaceIntersections(event);
          var faceIntersects = intersections.filter(function(intersection) {
            return !intersection.view.model.vertex || !intersection.view.model.vertex.editing;
          });
          // Ignore any editing intersections
          var closestEdgePosition;
          if (geometryGraph.isEditing()) {
            closestEdgePosition = this.findClosestNonEditingEdge(event);
          }
          if (!dragging) {
            this.trigger('dragStarted',
              mouseDownOnDraggableIntersections[0],
              event,
              faceIntersects[0] && faceIntersects[0].position,
              closestEdgePosition);
            dragging = true;
          } else {
            this.trigger('drag',
              mouseDownOnDraggableIntersections[0],
              event,
              faceIntersects[0] && faceIntersects[0].position,
              closestEdgePosition);
          }
          return true;
        } else {
          return false;
        }
      };

      this.overClickable = function() {
        var clickableViews = getClickableViews();
        return clickableViews.length > 0;
      };

      this.overDraggable = function() {
        var draggableViews = mouseOverViews.filter(function(view) {
          return view.isDraggable();
        });
        return draggableViews.length > 0;
      };

      this.click = function(event) {
        var clickableViews = getClickableViews();

        // Return value is used to deselect all of no scene view
        // click event is generated
        if (clickableViews.length > 0) {
          this.clickView = clickableViews[0];
          clickableViews[0].trigger('click', event);
          this.trigger('sceneViewClick', {event: event, view: clickableViews[0]});
          return true;
        } else {
          this.clickView = undefined;
          return false;
        }
      };

      this.dblclick = function(event) {

        var clickableViews = getClickableViews();
        if (clickableViews.length > 0) {
          if (this.clickView.cid === clickableViews[0].cid) {
            clickableViews[0].trigger('dblclick', event);
            this.trigger('sceneViewDblClick', {event: event, view: clickableViews[0]});
            return true;
          }
        }
        return false;
      };

      this.hoverstart = function(event) {
        if (firstMouseOverView) {
          firstMouseOverView.trigger('hoverstart', event);
          this.hoverView = firstMouseOverView;
        }
      };

      this.findFaceIntersections = function(event) {
        var sceneElement = $('#scene');
        var selector = createSelector(sceneElement, sceneModel.view.camera, event);
        var foundIntersections = sceneViews.reduce(function(acc, view) {
          var intersections = selector(view);
          intersections.forEach(function(i) {
            acc.push({
              view: view,
              distance: i.distance,
              position: i.position,
              faceIndex: i.faceIndex,
              object: i.object,
            });
          });
          return acc;
        }, []);

        foundIntersections = _.sortBy(foundIntersections, 'distance');
        return foundIntersections;
      };

      this.findClosestNonEditingEdge = function(event) {
        var sceneElement = $('#scene');
        var camera = sceneModel.view.camera;
        var mouseRay = calc.mouseRayForEvent(sceneElement, camera, event);

        var closestEdgePosition;
        var closestEdgeDistance;
        sceneViews.map(function(sceneView) {
          if (!sceneView.linesAreSnappable) {
            return;
          }

          var findClosestEdge = function(obj) {
            if ((obj instanceof THREE.Line) && (obj.screenBox)) {
              // Only use objects where the mouse is within the screen box
              var inBox =
                (((event.offsetX >= obj.screenBox.min.x) &&
                  (event.offsetX <= obj.screenBox.max.x)) &&
                ((event.offsetY >= obj.screenBox.min.y) &&
                 (event.offsetY <= obj.screenBox.max.y)));
              if (!inBox) {
                return;
              }

              var segments = [];
              for (var i = 0; i < obj.geometry.vertices.length - 1; ++i) {
                segments.push([obj.geometry.vertices[i], obj.geometry.vertices[i+1]]);
              }
              calc.positionOnLine(mouseRay, segments).forEach(
                function(positionForSegment) {

                  if (positionForSegment.inEllipse &&
                    ((positionForSegment.distance < closestEdgeDistance) ||
                    (closestEdgeDistance === undefined))) {
                    closestEdgeDistance = positionForSegment.distance;
                    closestEdgePosition = positionForSegment.position;
                  }
                });
            }
            if (obj.children && (obj.children.length > 0)) {
              obj.children.map(findClosestEdge);
            }
          };
          findClosestEdge({children: [sceneView.sceneObject]});
        });

        return closestEdgePosition;
      };

      var getClickableViews = function() {
        var nonPriorityViews = [];
        var priorityViews = [];
        mouseOverViews.forEach(function(view) {
          // Put priority view in front
          if (view.isClickable()) {
            if (view.hasPriority) {
              priorityViews.push(view);
            } else {
              nonPriorityViews.push(view);
            }
          }
        });
        var clickableViews = priorityViews.concat(nonPriorityViews);
        return clickableViews;
      };
    };

    var createSelector = function(sceneElement, camera, event) {
      var mouse = {};
      mouse.x = (event.offsetX / sceneElement.innerWidth()) * 2 - 1;
      mouse.y = -(event.offsetY / sceneElement.innerHeight()) * 2 + 1;

      var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
      var projector = new THREE.Projector();
      var mouse3D = projector.unprojectVector(vector, camera);
      var raycaster = new THREE.Raycaster(camera.position, mouse3D.sub(camera.position).normalize());

      return function(sceneView) {
        var isVertexView = !!sceneView.model.vertex;
        var testForIntersect =
          (isVertexView && ((sceneView.model.vertex.category === 'geometry') ||
                           (sceneView.model.vertex.type === 'workplane'))) ||
          !isVertexView;
        if (!testForIntersect) {
          return [];
        }
        // Only intersect mesh objects
        var allMeshes = [];
        var collectMeshes = function(obj) {
          if (obj instanceof THREE.Mesh) {
            allMeshes.push(obj);
          }
          if (obj.children && (obj.children.length > 0)) {
            obj.children.map(collectMeshes);
          }
        };
        collectMeshes({children: [sceneView.sceneObject, sceneView.hiddenSelectionObject]});
        var faceIntersects = raycaster.intersectObjects(allMeshes);

        return faceIntersects.map(function(i) {
          return {
            distance: i.distance,
            position: i.point,
            object: i.object,
            faceIndex: i.faceIndex,
          };
        });
      };
    };

    return new EventGenerator();

  });
