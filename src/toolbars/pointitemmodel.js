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

        name: 'point',
        
        activate: function() {
            toolbar.ItemModel.prototype.activate.call(this);
            var workplane = Calc.copyObj(currentWorkplane.get().vertex.workplane);
            geometryGraph.createPointPrototype({workplane: workplane});
        },

        icon: icons['point'],

        createAnother: function(type) {
            return type === 'point';
        } 

    });

    return Model;
})