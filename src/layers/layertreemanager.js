define([
    'backbone',
    'jquery',
    'lib/mustache',
    'geometrygraphsingleton', 
    'asyncAPI',
    'layers/layertreeMV',
    ], function(Backbone, $, Mustache, geometryGraph, AsyncAPI, LayerTreeMV) {

    var layerTree = geometryGraph.layerTree;

    var Model = Backbone.Model.extend({

        initialize: function(vertex) {
            this.views = [
                new TitleView({model: this}),
            ];
            this.rootDisplayModel = new LayerTreeMV.DisplayModel();
        },

        destroy: function() {

        },

        createContainer: function(type) {
            var oldLayerTreeObj = layerTree.toObj();
            var container = layerTree.createContainer(type);
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

    var ContainerView = Backbone.View.extend({

        className: 'layer-container',
        tagName: 'tr',

        initialize: function(attributes) {
            this.container = attributes.container;
            this.render();
            $('#geometry').append(this.$el);
        },


        render: function() {
            var view = {
                name: this.container.name,
                type: this.container.type,
            }
            var template = 
                '<td class="title">' + 
                '<img src="/images/icons/{{type}}24x24.png"/>' + 
                '<div class="name">{{name}}</div>' + 
                '<div class="delete"></div>' +
                '</td>';
            this.$el.html(Mustache.render(template, view));
            return this;
        },


    });
    
    return new Model();

});