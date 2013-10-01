define([
    'geomnode',
    'icons',
    'toolbars/booleanitemmodel',
  ], function(
    GeomNode,
    icons,
    BooleanItemModel) {

  var Model = BooleanItemModel.extend({
    
    name: 'intersect',
    VertexConstructor: GeomNode.Intersect,
    icon: icons['intersect'],

  });

  return Model;

});
