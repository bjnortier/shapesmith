define([
    'icons',
    'geometrygraphsingleton',
    'selection',
    'toolbars/toolbar'
  ], function(
    icons,
    geometryGraph,
    selection,
    toolbar) {

    var Model = toolbar.ItemModel.extend({

      name: 'extrude',

      initialize: function(attributes) {
        toolbar.ItemModel.prototype.initialize.call(this, attributes);
        this.set('enabled', false);
        selection.on('selected', this.selectionChanged, this);
        selection.on('deselected', this.selectionChanged, this);
      },

      selectionChanged: function(_, selection) {
        var polyline;
        if (selection.length === 1) {
          var vertex = geometryGraph.vertexById(selection[0]);
          if (vertex.type === 'polyline') {
            polyline = vertex;
          }
        }
        if (polyline) {
          this.set('enabled', true);
        } else {
          this.set('enabled', false);
        }
      },

      activate: function(savedSelection) {
        toolbar.ItemModel.prototype.activate.call(this);
        if (this.get('enabled')) {
          var selectedId = savedSelection[0];
          var height = 10;

          // Extrude up to the next elevation plane
          // if possible
          var polyline = geometryGraph.vertexById(selectedId);
          var polylineWorkplaneZ = (polyline.workplane && polyline.workplane.origin.z) || 0;

          var elevationPlanes = geometryGraph.verticesByType('elevation_plane');
          var elevationPlanesHeights = elevationPlanes.map(function(plane) {
            return plane.parameters.height;
          }).sort();

          for (var i = 0; i < elevationPlanesHeights.length; ++i) {
            if (elevationPlanesHeights[i] > polylineWorkplaneZ) {
              height = elevationPlanesHeights[i] - polylineWorkplaneZ;
              break;
            }
          }
          geometryGraph.createExtrudePrototype(polyline, height);

        }
      },

      icon: icons['extrude'],

    });

    return Model;

  });
