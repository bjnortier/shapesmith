define([
  'modelviews/variableMV',
  'modelviews/workplaneMV',
  'modelviews/pointMV',
  'modelviews/polylineMV',
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
  'toolbars/polylineitemmodel',
  'toolbars/cubeitemmodel',
  'toolbars/sphereitemmodel',
  'toolbars/cylinderitemmodel',
  'toolbars/coneitemmodel',
  'toolbars/unionitemmodel',
  'toolbars/subtractitemmodel',
  'toolbars/intersectitemmodel',
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
    PolylineItemModel,
    CubeItemModel,
    SphereItemModel,
    CylinderItemModel,
    ConeItemModel,
    UnionItemModel,
    SubtractItemModel,
    IntersectItemModel,
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
    modelgraph.addWrapper('cone', ConeMV);
    modelgraph.addWrapper('union', BooleanMV);
    modelgraph.addWrapper('subtract', BooleanMV);
    modelgraph.addWrapper('intersect', BooleanMV);

    // geomToolbar.addItem(new PointItemModel());
    geomToolbar.addItem(new CubeItemModel());
    geomToolbar.addItem(new SphereItemModel());
    geomToolbar.addItem(new CylinderItemModel());
    geomToolbar.addItem(new ConeItemModel());
    geomToolbar.addItem(new UnionItemModel());
    geomToolbar.addItem(new IntersectItemModel());
    geomToolbar.addItem(new SubtractItemModel());

    var expander = new Toolbar.ExpanderItem();
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