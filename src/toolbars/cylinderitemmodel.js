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
      
      name: 'cylinder',   
      
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
        
        var cylinderOptions = {
          editing    : true,
          proto    : true,
          workplane  : workplane,
        };
        var cylinderVertex = new GeomNode.Cylinder(cylinderOptions);
        geometryGraph.add(cylinderVertex, function() {
          geometryGraph.addEdge(cylinderVertex, point);
        });
      },

      icon: icons['cylinder'],

      createAnother: function(type) {
        return type === 'cylinder';
      } 

    });

    return Model;

  });