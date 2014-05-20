define([
    'modelviews/variableMV',
    'modelviews/workplaneMV',
    'modelviews/pointMV',
    'modelviews/cubeMV',
    'modelviews/sphereMV',
    'modelviews/cylinderMV',
    'modelviews/coneMV',
    'modelviews/booleanMV',
    'modelviews/modelgraph',
    'modelviews/transforms/transforminitiator',
    'modelviews/actionsoverlayMV',
    'icons',
    'toolbars/toolbar',
    'toolbars/geomtoolbar',
    'toolbars/maintoolbar',
    'toolbars/pointitemmodel',
    'toolbars/cubeitemmodel',
    'toolbars/sphereitemmodel',
    'toolbars/cylinderitemmodel',
    'toolbars/coneitemmodel',
    'toolbars/importstlitemmodel',
    'toolbars/unionitemmodel',
    'toolbars/subtractitemmodel',
    'toolbars/intersectitemmodel',
    'toolbars/saveitemmodel',
    'toolbars/exititemmodel',
    'toolbars/exportstlitemmodel',
    'toolbars/helpitemmodel',
  ], function(
    VariableMV,
    WorkplaneMV,
    PointMV,
    CubeMV,
    SphereMV,
    CylinderMV,
    ConeMV,
    BooleanMV,
    modelgraph,
    transformInitiator,
    actionsOverlayMV,
    icons,
    Toolbar,
    geomToolbar,
    mainToolbar,
    PointItemModel,
    CubeItemModel,
    SphereItemModel,
    CylinderItemModel,
    ConeItemModel,
    ImportSTLItemModel,
    UnionItemModel,
    SubtractItemModel,
    IntersectItemModel,
    SaveItemModel,
    ExitItemModel,
    ExportSTLItemModel,
    HelpItemModel) {

    var init = function() {

      modelgraph.addWrapper('variable', VariableMV);
      modelgraph.addWrapper('workplane', WorkplaneMV);
      modelgraph.addWrapper('point', PointMV);
      modelgraph.addWrapper('cube', CubeMV);
      modelgraph.addWrapper('sphere', SphereMV);
      modelgraph.addWrapper('cylinder', CylinderMV);
      modelgraph.addWrapper('cone', ConeMV);
      modelgraph.addWrapper('union', BooleanMV);
      modelgraph.addWrapper('subtract', BooleanMV);
      modelgraph.addWrapper('intersect', BooleanMV);
      modelgraph.addWrapper('stl', BooleanMV);

      // geomToolbar.addItem(new PointItemModel());
      geomToolbar.addItem(new CubeItemModel());
      geomToolbar.addItem(new SphereItemModel());
      geomToolbar.addItem(new CylinderItemModel());
      geomToolbar.addItem(new ConeItemModel());
      geomToolbar.addItem(new ImportSTLItemModel());
      geomToolbar.addItem(new UnionItemModel());
      geomToolbar.addItem(new IntersectItemModel());
      geomToolbar.addItem(new SubtractItemModel());

      var expander = new Toolbar.ExpanderItem();
      mainToolbar.addItem(new SaveItemModel());
      mainToolbar.addItem(new ExportSTLItemModel());
      mainToolbar.addItem(new ExitItemModel());

      var helpItemModel = new HelpItemModel();
      mainToolbar.addItem(helpItemModel);
      // mainToolbar.addItem(expander);
      expander.toggle();

      if (Shapesmith.firstTry) {
        helpItemModel.click();
      }

    };

    return {
      init: init
    };

  });
