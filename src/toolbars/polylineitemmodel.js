define([
        'calculations',
        'modelviews/currentworkplane',
        'geometrygraphsingleton',
        'icons',
        'toolbars/toolbar'
    ], function(
        Calc,
        currentWorkplane,
        geometryGraph,
        icons,
        toolbar) {

    var Model = toolbar.ItemModel.extend({
        
        name: 'polyline',   
        
        activate: function() {
            toolbar.ItemModel.prototype.activate.call(this);
            var workplane = Calc.copyObj(currentWorkplane.get().vertex.workplane);
            geometryGraph.createPolylinePrototype({workplane: workplane});
        },

        icon: icons['polyline'],

        createAnother: function(type) {
            return type === 'polyline';
        } 

    });

    return Model;

});