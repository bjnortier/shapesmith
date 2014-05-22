define([
    'backbone',
    'jquery',
    'lib/jquery.autoGrowInput',
    'lib/mustache',
  ], function(Backbone, $, __$, Mustache) {

    var Model = Backbone.Model.extend({

      initialize: function() {
        this.set('gridsize', 1);
        this.set('snapgrid', true);
        this.set('snapfaces', false);
        this.set('snapedges', false);
      },

      edit: function() {
        if (!this.view) {
          this.view = new View({model: this});
        }
      },

      save: function() {
        if (!this.hasErrors) {
          this.view.remove();
          this.view = undefined;
        }
      }

    });

    var View = Backbone.View.extend({

      id: 'dialog',

      initialize: function() {
        this.render();
        $('#scene').append(this.$el);
        $('.field').autoGrowInput();
      },

      render: function() {
        var view = {
          title: 'Settings',
          gridsize: this.model.get('gridsize'),
          snappingLabel: 'Snap to:',
          snapping: [
            {
              label: 'Grid',
              key: 'snapgrid',
            },
            {
              label: 'Faces',
              key: 'snapfaces'
            }
          ]
        };
        var template = '<div class="icon32 settings"></div><h2>{{title}}</h2>' +
        '<table><tr><td>Grid spacing</td><td>' +
        '<input class="field gridsize" type="text" value="{{gridsize}}"></input>' +
        '</td></tr>' +
        '<tr><td colspan="2"><h3>{{snappingLabel}}</h3></td><tr>' +
        '{{#snapping}}<tr><td colspan="2">' +
        '<input class="field {{key}}" type="checkbox" id="snap_{{key}}"><label for="snap_{{key}}">{{label}}</label>' +
        '</td></tr>{{/snapping}}</table>' +
        '<div class="button-container"><div class="button">Save settings</div></div>';
        this.$el.html(Mustache.render(template, view));

        var that = this;
        ['snapgrid', 'snapedges', 'snapfaces'].forEach(function(key) {
          that.$el.find('.' + key).prop('checked', that.model.get(key));
        });

        return this;
      },

      events: {
        'change .field' : 'fieldChange',
        'click .button' : 'save',
        'keypress .gridsize': 'keypress',
      },

      fieldChange: function(event) {
        event.stopPropagation();
        if (this.updateFromDOM) {
          this.updateFromDOM();
        }
      },

      updateFromDOM: function() {
        this.model.hasErrors = false;
        this.$el.find('.gridsize').removeClass('error');
        var that = this;
        var gridSizeStr = that.$el.find('.gridsize').val();
        try {
          var parsed = parseFloat(gridSizeStr);
          if (isNaN(parsed) || (parsed <= 0)) {
            throw new Error();
          }
          if (this.model.get('gridsize') !== parsed) {
            this.model.set('gridsize', parsed);
          }
        } catch (e) {
          this.model.hasErrors = true;
          this.$el.find('.gridsize').addClass('error');
        }
        ['snapgrid', 'snapedges', 'snapfaces'].forEach(function(key) {
          that.model.set(key, that.$el.find('.' + key).prop('checked'));
        });
      },

      keypress: function(event) {
        if (event.keyCode === 13) {
          this.updateFromDOM();
          this.save();
        }
      },

      save: function() {
        this.model.save();
      },

    });

    return new Model();

  });
