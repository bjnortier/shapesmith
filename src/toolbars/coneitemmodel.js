define([
    'calculations',
    'modelviews/currentworkplane',
    'geometrygraphsingleton',
    'icons',
    'toolbars/toolbar',
    'geomnode',
  ], function(
    Calc,
    currentWorkplane,
    geometryGraph,
    icons,
    toolbar,
    GeomNode) {

    var Model = toolbar.ItemModel.extend({

      name: 'cone',

      activate: function() {
        toolbar.ItemModel.prototype.activate.call(this);

        var workplane = Calc.copyObj(currentWorkplane.get().vertex.workplane);
        var point = new GeomNode.Point({
          editing   : true,
          proto   : true,
          implicit  : true,
          workplane : workplane,
        });
        geometryGraph.add(point);

        var coneOptions = {
          editing    : true,
          proto    : true,
          workplane  : workplane,
        };
        var coneVertex = new GeomNode.Cone(coneOptions);
        geometryGraph.add(coneVertex, function() {
          geometryGraph.addEdge(coneVertex, point);
        });
      },

      icon: icons['cone'],

      createAnother: function(type) {
        return type === 'cone';
      },

    });

    return Model;

  });
