define([], function() {

  var uniqueId = 1;

  function Tracker(id) {

    this.start = function(trackable) {
      trackable.trigger('start', id);
    };

    this.finish = function(trackable) {
      trackable.trigger('finish', id);
    };

  }

  function create(trackable) {

    var tracker = new Tracker(uniqueId++);
    tracker.start(trackable);

    return {
      finish: function() {
        tracker.finish(trackable);
      }
    };

  }

  return {
    create: create
  };

});
