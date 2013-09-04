define([
    'toolbars/toolbar', 
    'commandstack', 
    'interactioncoordinator',
    'selection',
    'modelviews/vertexMV',
    'modelviews/modelgraph',
    ], 
    function(
        toolbar, 
        commandStack, 
        coordinator, 
        selection,
        VertexMV,
        modelGraph) {

    var SelectItemModel = toolbar.ItemModel.extend({
        
        name: 'select',

        activate: function() {
            toolbar.ItemModel.prototype.activate.call(this);
            selection.canSelect = true;
        },

        deactivate: function() {
            toolbar.ItemModel.prototype.deactivate.call(this);
            selection.canSelect = false;
            selection.deselectAll();
        },

    });

    var selectItemModel   = new SelectItemModel();

    var GeomToolbarModel = toolbar.Model.extend({

        appendSelector: '#toolbar',

        initialize: function(attributes) {
            toolbar.Model.prototype.initialize.call(this, attributes);
            commandStack.on('beforePop', this.beforePop, this);
            VertexMV.eventProxy.on('committedCreate', this.committedCreate, this);
            VertexMV.eventProxy.on('cancelledCreate', this.setToSelect, this);
        },

        activate: function(item) {
            if (item !== this.activeItem) {
                var savedSelection = selection.getSelected();
                this.deactivateActiveItem();

                // Don't re-enter on cancel
                VertexMV.eventProxy.off('cancelledCreate', this.setToSelect, this);
                selection.deselectAll();
                modelGraph.cancelIfEditing();
                VertexMV.eventProxy.on('cancelledCreate', this.setToSelect, this);

                this.setActive(item, savedSelection);
            }
        },

        setActive: function(item, savedSelection) {
            this.activeItem = item;
            item.activate(savedSelection)
        },

        deactivateActiveItem: function() {
            if (this.activeItem) {
                this.activeItem.deactivate();
            }
        },

        itemClicked: function(item) {
            this.activate(item);
        },

        // Cancel any active tools when geometry is popped
        beforePop: function() {
            this.setToSelect();
            selection.deselectAll();
        },

        committedCreate: function(committedVertices) {
            // The first vertex in the list is by convention the main vertex 
            if (!committedVertices[0].implicit) {
                for (var i = 0; i < this.items.length; ++i) {
                    var item = this.items[i];
                    if (item.createAnother && item.createAnother(committedVertices[0].type)) {
                        this.setActive(item, []);
                        return;
                    }
                }
                this.setToSelect();
            }

        },

        setToSelect: function() {
            this.activate(selectItemModel);
        },

    });

    var toolbarModel = new GeomToolbarModel({name: 'geometry'});
    toolbarModel.addItem(selectItemModel);
    toolbarModel.setToSelect();
    return toolbarModel;

});