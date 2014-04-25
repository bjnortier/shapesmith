define([
    'calculations',
    'selection',
    'geomnode',
    'modelviews/vertexMV',
    'modelviews/currentworkplane',
    'geometrygraphsingleton',
    'icons',
    'toolbars/toolbar',
    'toolbars/geomtoolbar',
    './parsestl',
    'asyncAPI',
  ], function(
    Calc,
    selection,
    GeomNode,
    VertexMV,
    currentWorkplane,
    geometryGraph,
    icons,
    toolbar,
    geomtoolbar,
    parseSTL,
    AsyncAPI) {

    function uploadFile(input, successFn) {
      if (!window.FileReader) {
        alert('No FileReader support yet in this browser. Please try Google Chrome or Firefox');
        return;
      }
      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        console.log(theFile);
        return function(e) {
          if (e.target.readyState === 2) {
            input.value = "";
            successFn(e.target.result);
          }
        };
      })(input.files[0]);

      // Read in the file as a data URL.
      reader.readAsBinaryString(input.files[0]);
    }

    $('#stl-file-select-input').change(function() {
      uploadFile(this, function(contents) {
        var csg = parseSTL(contents);

        var meshVertex = new GeomNode.Mesh({
          proto: true,
          editing: true,
          parameters: {csg: csg},
          workplane: Calc.copyObj(currentWorkplane.get().vertex.workplane),
        });
        geometryGraph.add(meshVertex);
        var result = AsyncAPI.tryCommitCreate([meshVertex]);
        if (!result.error) {
          var committedVertices = result.newVertices;
          VertexMV.eventProxy.trigger('committedCreate', [meshVertex], committedVertices);
        }
      });
    });

    var Model = toolbar.ItemModel.extend({
      
      name: 'stl in',   
      
      activate: function() {
        // toolbar.ItemModel.prototype.activate.call(this);
        $('#stl-file-select-input').click();
        geomtoolbar.setToSelect();
      },
      
      icon: icons.stl_in,

      createAnother: function() {
        return false;
      }

    });

    return Model;

  });