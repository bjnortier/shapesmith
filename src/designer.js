define([
    'modelviews/variableMV',
    'modelviews/workplaneMV',
    'modelviews/pointMV',
    'modelviews/polylineMV',
    'modelviews/cubeMV',
    'modelviews/sphereMV',
    'modelviews/cylinderMV',
    'modelviews/booleanMV',
    'modelviews/modelgraph',
    'modelviews/transforms/transforminitiator',
    'modelviews/actionsoverlayMV',
    'icons',
    'toolbars/toolbar',
    'toolbars/geomtoolbar',
    'toolbars/maintoolbar',
    'toolbars/pointitemmodel',
    'toolbars/polylineitemmodel',
    'toolbars/cubeitemmodel',
    'toolbars/sphereitemmodel',
    'toolbars/cylinderitemmodel',
    'toolbars/unionitemmodel',
    'toolbars/subtractitemmodel',
    'toolbars/intersectitemmodel',
    'toolbars/settingsitemmodel',
    'toolbars/saveitemmodel',
    'toolbars/exititemmodel',
    'toolbars/exportobjitemmodel',
    ], function(
        VariableMV,
        WorkplaneMV,
        PointMV,
        PolylineMV,
        CubeMV,
        SphereMV,
        CylinderMV,
        BooleanMV,
        modelgraph,
        transformInitiator,
        actionsOverlayMV,
        icons,
        Toolbar,
        geomToolbar,
        mainToolbar,
        PointItemModel,
        PolylineItemModel,
        CubeItemModel,
        SphereItemModel,
        CylinderItemModel,
        UnionItemModel,
        SubtractItemModel,
        IntersectItemModel,
        SettingsItemModel,
        SaveItemModel,
        ExitItemModel,
        ExportOBJItemModel) {

    var init = function() {

        modelgraph.addWrapper('variable', VariableMV);
        modelgraph.addWrapper('workplane', WorkplaneMV);
        modelgraph.addWrapper('point', PointMV);
        modelgraph.addWrapper('cube', CubeMV);
        modelgraph.addWrapper('sphere', SphereMV);
        modelgraph.addWrapper('cylinder', CylinderMV);
        modelgraph.addWrapper('union', BooleanMV);
        modelgraph.addWrapper('subtract', BooleanMV);
        modelgraph.addWrapper('intersect', BooleanMV);

        // geomToolbar.addItem(new PointItemModel());
        geomToolbar.addItem(new CubeItemModel());
        geomToolbar.addItem(new SphereItemModel());
        geomToolbar.addItem(new CylinderItemModel());
        geomToolbar.addItem(new UnionItemModel());
        geomToolbar.addItem(new IntersectItemModel());
        geomToolbar.addItem(new SubtractItemModel());

        var expander = new Toolbar.ExpanderItem();
        mainToolbar.addItem(new SettingsItemModel());
        mainToolbar.addItem(new SaveItemModel());
        mainToolbar.addItem(new ExitItemModel());
        mainToolbar.addItem(expander);
        mainToolbar.addItem(new ExportOBJItemModel());
        expander.toggle();

    }

    return {
        init: init
    }
});