define([
    'jquery',
    'lib/mustache',
    'backbone',
  ],
  function($, Mustache, Backbone) {

    var ItemModel = Backbone.Model.extend({

      initialize: function() {
        this.view = new ItemView({model: this});
        this.set('enabled', true);
      },

      click: function() {
        if (this.get('enabled')) {
          this.toolbarModel.itemClicked(this);
        }
      },

      activate: function() {
        this.set('active', true);
      },

      deactivate: function() {
        this.set('active', false);
      },

    });

    var ItemView = Backbone.View.extend({

      tagName: "li",
      className: "item",

      initialize: function() {
        this.render();
        this.$el.addClass(this.model.name);
        this.model.on('change:active', this.updateActive, this);
        this.model.on('change:enabled', this.updateEnabled, this);
        this.updateActive();
        this.updateEnabled();
      },

      render: function() {
        var view = {
          icon: this.model.icon,
          label: this.model.name.toUpperCase(),
        };
        var template =
          '<div class="icon32">{{{icon}}}</div>' +
          '<div class="label">{{label}}</div>';
        $(this.el).html(Mustache.render(template, view));
        return this;
      },

      events: {
        'click' : 'click',
      },

      click: function() {
        this.model.click();
      },

      updateActive: function() {
        if (this.model.get('active')) {
          this.$el.addClass('active');
        } else {
          this.$el.removeClass('active');
        }
      },

      updateEnabled: function() {
        if(!this.model.get('enabled')) {
          this.$el.addClass('disabled');
        } else {
          this.$el.removeClass('disabled');
        }
      },

    });

    var ExpanderItem = Backbone.Model.extend({

      initialize: function() {
        this.view = new ExpanderItemView({model: this});
        this.hidden = false;
      },

      toggle: function() {
        if (this.hidden) {
          this.view.$el.find('~ li').show();
          this.view.$el.removeClass('hidden');
        } else {
          this.view.$el.find('~ li').hide();
          this.view.$el.addClass('hidden');
        }
        this.hidden = !this.hidden;
      }

    });

    var ExpanderItemView = Backbone.View.extend({

      tagName: "li",
      className: "item expander",

      initialize: function() {
        this.render();
      },

      render: function() {
        $(this.el).html('<div class="icon8x32"></div>');
        return this;
      },

      events: {
        'click' : 'click',
      },

      click: function() {
        this.model.toggle();
      },

    });

    var Model = Backbone.Model.extend({

      initialize: function(attributes) {
        this.name = attributes.name;
        this.view = new View({model: this});
        this.items = [];
        $(this.appendSelector).append(this.view.$el);
      },

      addItem: function(itemModel) {
        itemModel.toolbarModel = this;
        this.items.push(itemModel);
        this.view.$el.append(itemModel.view.$el);
      },

    });

    var View = Backbone.View.extend({

      tagName: "ol",
      className: "toolbar",

      initialize: function() {
        this.$el.addClass(this.model.name);
      },

    });

    return  {
      ItemModel: ItemModel,
      ItemView: ItemView,
      Model: Model,
      View: View,
      ExpanderItem: ExpanderItem,
    };

  });
