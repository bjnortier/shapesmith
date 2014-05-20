define([
    'backbone',
    'jquery',
    'lib/mustache',
    'geometrygraphsingleton',
    'asyncAPI',
    'layers/layertreeMV',
  ], function(
    Backbone,
    $,
    Mustache,
    geometryGraph,
    AsyncAPI,
    LayerTreeMV) {

    var layerTree = geometryGraph.layerTree;

    var Model = Backbone.Model.extend({

      initialize: function() {
        this.views = [
          new TitleView({model: this}),
        ];
        this.rootDisplayModel = new LayerTreeMV.DisplayModel();
      },

      destroy: function() {

      },

      createContainer: function(type) {
        var oldLayerTreeObj = layerTree.toObj();
        layerTree.createContainer(type);
        var newLayerTreeObj = layerTree.toObj();
        AsyncAPI.commitLayerTree(oldLayerTreeObj, newLayerTreeObj);

      },

    });

    var TitleView = Backbone.View.extend({

      id: 'layertree-manager',

      initialize: function() {
        this.render();
        $('#geometry').before(this.$el);
      },

      render: function() {
        var template =
          '<td colspan="3" class="title">' +
          '<div title="Building" class="icon24 building"></div>' +
          '<div title="Storey" class="icon24 storey"></div>' +
          '<div title="Zone" class="icon24 zone"></div>' +
          '</td>';
        var view = {};
        this.$el.html(Mustache.render(template, view));
        return this;
      },

      events: {
        'click .building' : 'clickNewBuilding',
        'click .storey' : 'clickNewStorey',
        'click .zone' : 'clickNewZone',
      },

      clickNewBuilding: function() {
        this.model.createContainer('building');
      },

      clickNewStorey: function() {
        this.model.createContainer('storey');
      },

      clickNewZone: function() {
        this.model.createContainer('zone');
      },

    });

    return new Model();

  });
