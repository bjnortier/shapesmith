define([
        'toolbars/toolbar',
        'icons',
    ],
    function(
        Toolbar,
        icons
    ) {

    var Model = Toolbar.ItemModel.extend({

        name: 'designs',

        initialize: function() {
            this.icon = icons.list;
            Toolbar.ItemModel.prototype.initialize.call(this);
        },

        click: function() {
            window.location = '/_ui/' + globals.user + '/designs';
        },

    });

    return Model;

});