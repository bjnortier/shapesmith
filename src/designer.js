define([
    'modelviews/variableMV',
    'modelviews/workplaneMV',
    'modelviews/pointMV',
    'modelviews/polylineMV',
    'modelviews/cubeMV',
    'modelviews/sphereMV',
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
    'toolbars/subtractitemmodel',
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
        SubtractMV,
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
        SubtractItemModel,
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
        modelgraph.addWrapper('subtract', SubtractMV);

        // geomToolbar.addItem(new PointItemModel());
        geomToolbar.addItem(new CubeItemModel());
        geomToolbar.addItem(new SphereItemModel());
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