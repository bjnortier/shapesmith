define([
    'toolbars/toolbar',
    'icons',
    'settings',
    ],
    function(
        Toolbar,
        icons,
        settings
    ) {

    var Model = Toolbar.ItemModel.extend({

        name: 'settings',

        initialize: function() {
            this.icon = icons.cog;
            Toolbar.ItemModel.prototype.initialize.call(this);
        },

        click: function() {
            settings.edit();
        },

    });

    return Model;

});