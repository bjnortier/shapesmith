define([
    'geomnode',
    'icons',
    'toolbars/booleanitemmodel',
  ], function(
    GeomNode,
    icons,
    BooleanItemModel) {

    var Model = BooleanItemModel.extend({

      name: 'union',
      VertexConstructor: GeomNode.Union,
      icon: icons['union'],

    });

    return Model;

  });
