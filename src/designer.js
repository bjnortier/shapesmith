define([
    'modelviews/variableMV',
    'modelviews/workplaneMV',
    'modelviews/pointMV',
    'modelviews/polylineMV',
    'modelviews/cubeMV',
    'modelviews/sphereMV',
    'modelviews/subtractMV',
    'modelviews/subtractMV',
    'modelviews/subtractMV',
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
        UnionMV,
        SubtractMV,
        IntersectMV,
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
        modelgraph.addWrapper('union', UnionMV);
        modelgraph.addWrapper('subtract', SubtractMV);
        modelgraph.addWrapper('intersect', IntersectMV);

        // geomToolbar.addItem(new PointItemModel());
        geomToolbar.addItem(new CubeItemModel());
        geomToolbar.addItem(new SphereItemModel());
        geomToolbar.addItem(new UnionItemModel());
        geomToolbar.addItem(new SubtractItemModel());
        geomToolbar.addItem(new IntersectItemModel());

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