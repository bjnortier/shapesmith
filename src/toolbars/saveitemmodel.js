define([
  'toolbars/toolbar',
  'icons',
  'scene',
  ],
  function(
    Toolbar,
    icons,
    sceneModel
  ) {

  var Model = Toolbar.ItemModel.extend({

    name: 'save',

    initialize: function() {
      this.icon = icons.save;
      Toolbar.ItemModel.prototype.initialize.call(this);
    },

    click: function() {

      // sceneModel.view.renderer.autoClear = false;
      sceneModel.view.updateScene = true;
      sceneModel.view.render();
      var screenshot = sceneModel.view.renderer.domElement.toDataURL();

      var commit = $.getQueryParam("commit");
      $.ajax({
        type: 'PUT',
        url: '/_api/' + globals.user + '/' + globals.design + '/refs/heads/master/',
        contentType: 'application/json',
        data: JSON.stringify({commit: commit, screenshot: screenshot}),
        success: function(response) {
          console.info('SAVE: ' + commit);
          // hintView.set('Saved.');
          setTimeout(function() {
            // hintView.clear();
          }, 1000);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.error('could not save');
        }
      });
    },

  });

  return Model;

});