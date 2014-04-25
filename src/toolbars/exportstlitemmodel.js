define([
    'toolbars/toolbar',
    'icons',
    'modelviews/objecttree',
  ],
  function(
    Toolbar,
    icons,
    objectTree) {

    function stringifyVector(vec){
      return '' + vec.x + ' '  + vec.y + ' ' + vec.z;
    }

    function stringifyVertex(vec){
      return '      vertex ' + stringifyVector(vec) + '\n';
    }

    function accumulateSTL(geometry){
      var vertices = geometry.vertices;
      var faces    = geometry.faces;

      var acc = '';
      for(var i = 0, il = faces.length; i < il; i++) {
        var face = faces[i];

        acc += '  facet normal ' + stringifyVector(face.normal) + ' \n';
        acc += '    outer loop\n';
        acc += stringifyVertex(vertices[face.a]);
        acc += stringifyVertex(vertices[face.b]);
        acc += stringifyVertex(vertices[face.c]);
        acc += '    endloop\n';
        acc += '  endfacet\n';

        if (face.d) {
          acc += '  facet normal ' + stringifyVector(face.normal) + ' \n';
          acc += '    outer loop\n';
          acc += stringifyVertex(vertices[face.a]);
          acc += stringifyVertex(vertices[face.c]);
          acc += stringifyVertex(vertices[face.d]);
          acc += '    endloop\n';
          acc += '  endfacet\n';
        }
      }
      return acc;
    }

    var Model = Toolbar.ItemModel.extend({

      name: 'stl out',

      initialize: function() {
        Toolbar.ItemModel.prototype.initialize.call(this);
      },

      click: function() {
        
        
        var stl = 'solid ' + Shapesmith.design + '\n';
        
        var topModels = objectTree.getTopLevelModels();
        topModels.forEach(function(model) {
          var geometry = model.sceneView.sceneObject.children[0].geometry;
          stl += accumulateSTL(geometry);
        });

        stl += 'endsolid';

        // https://github.com/eligrey/FileSaver.js
        var blob = new Blob([stl], {type: 'text/plain;charset=utf-8'});
        saveAs(blob, Shapesmith.design  + '.stl');
      },

      icon: icons['stl_out'],

    });

    return Model;

  });