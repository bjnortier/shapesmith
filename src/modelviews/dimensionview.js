define([
        'backbone',
        'calculations',
        'scene',
        'interactioncoordinator',
        'modelviews/overlaydomview',
    ], 
    function(Backbone, calc, sceneModel, coordinator, OverlayDOMView) {
    
    var View = OverlayDOMView.extend({

        initialize: function() {
            $('#scene').append(this.$el);
            this.update();
            OverlayDOMView.prototype.initialize.call(this);
        },

        remove: function() {
            OverlayDOMView.prototype.remove.call(this);
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