define([
    'geomnode',
    'icons',
    'toolbars/booleanitemmodel',
  ], function(
    GeomNode,
    icons,
    BooleanItemModel) {

    var Model = BooleanItemModel.extend({
      
      name: 'subtract',
      VertexConstructor: GeomNode.Subtract,
      icon: icons['subtract'],
      maxNumberOfChildren: 2,

    });

    return Model;

  });
