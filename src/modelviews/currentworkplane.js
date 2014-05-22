define(['geometrygraphsingleton'], function(geometryGraph) {

  var workplaneModel;

  var set = function(newWorkplaneModel) {
    workplaneModel = newWorkplaneModel;
  };

  var get = function() {
    return workplaneModel;
  };

  var getGridSize = function() {
    return geometryGraph.evaluate(workplaneModel.vertex.parameters.gridsize);
  };

  return {
    get: get,
    set: set,
    getGridSize: getGridSize,
  };

});
