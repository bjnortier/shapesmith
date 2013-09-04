define([
        'toolbars/toolbar',
        'icons',
    ],
    function(
        Toolbar,
        icons
    ) {

    var Model = Toolbar.ItemModel.extend({

        name: 'obj',

        initialize: function() {
            this.icon = icons.export_obj;
            Toolbar.ItemModel.prototype.initialize.call(this);
        },

        click: function() {
            var graphSHA = $.getQueryParam("commit");
            window.location = '/' + globals.user + '/' + globals.design + '/obj/' + graphSHA + '/';
        },

    });

    return Model;

});