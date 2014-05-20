define([
    'jquery',
    'toolbars/toolbar',
    'icons'
  ],
  function(
    $,
    Toolbar,
    icons) {

    var Model = Toolbar.ItemModel.extend({

      name: 'help',

      initialize: function() {
        Toolbar.ItemModel.prototype.initialize.call(this);
        $('.overlay-help input[type="button"]').click(this.click);
      },

      click: function() {
        $('.overlay-help').toggle();
      },

      icon: icons.help,

    });

    return Model;

  });
