define([], function() {

  var workplaneVertex;

  var set = function(newWorkplaneVertex) {
    workplaneVertex = newWorkplaneVertex;
  }

  var get = function() {
    return workplaneVertex;
  }

  return {
    get: get,
    set: set,
  }

});