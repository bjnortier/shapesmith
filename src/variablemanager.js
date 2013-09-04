define([
    'backbone',
    'jquery',
    'lib/mustache',
    'geometrygraphsingleton', 
    ], function(Backbone, $, Mustache, geometryGraph) {

    var Model = Backbone.Model.extend({

        initialize: function(vertex) {
            this.views = [
                new TitleView({model: this}),
            ];
        },

    });

    var TitleView = Backbone.View.extend({

        id: 'variable-manager',
        tagName: 'tr',

        initialize: function() {
            this.render();
            $('#variables').append(this.$el);
        },

        render: function() {
            var template = 
                '<td colspan="3" class="section">' +
                '<div>variables <span class="add">+</span></div>' + 
                '</td>'; 
            var view = {};
            this.$el.html(Mustache.render(template, view));
            return this;
        },

        events: {
            'click .add': 'addVariableProto',
        },

        addVariableProto: function(event) {
            event.stopPropagation();
            if (!geometryGraph.isEditing()) {
                geometryGraph.createVariablePrototype();
            }
        },

    });
    
    return new Model();

});