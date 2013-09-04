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
        
        name: 'sphere',   
        
        activate: function() {
            toolbar.ItemModel.prototype.activate.call(this);

            var workplane = Calc.copyObj(currentWorkplane.get().vertex.workplane);
            var point = new GeomNode.Point({
                editing   : true,
                proto     : true,
                implicit  : true, 
                workplane : workplane,
            });
            geometryGraph.add(point);
            
            var sphereOptions = {
                editing      : true,
                proto        : true,
                workplane    : workplane,
            }
            var sphereVertex = new GeomNode.Sphere(sphereOptions);
            geometryGraph.add(sphereVertex, function() {
                geometryGraph.addEdge(sphereVertex, point);
            });
        },

        icon: icons['sphere'],

         createAnother: function(type) {
            return type === 'sphere';
        } 

    });

    return Model;

});