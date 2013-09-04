define([
    'lib/mustache',
    'scene',
    'calculations',
    'geometryGraphSingleton',
    'modelviews/dimensionview',
  ], function(
    Mustache,
    sceneModel,
    calc,
    geometryGraph,
    DimensionView) {

  var View = DimensionView.extend({

    className: 'dimensions coordinate',

    initialize: function(options) {
      this.vertex = options.vertex;
      this.origin = options.origin;
      this.isGlobal = options.isGlobal;
      this.render();
      DimensionView.prototype.initialize.call(this);
    },

    render: function() {
      var template = 
        '(<div class="dim x">{{x}}</div>,' +
        '<div class="dim y">{{y}}</div>,' +
        '<div class="dim z">{{z}}</div>)';
      var view = 
        calc.objToVector(this.origin, geometryGraph, THREE.Vector3);
      this.$el.html(Mustache.render(template, view));
    },

    update: function() {
      this.render();
      var camera = sceneModel.view.camera;
      var sceneWidth = $('#scene').innerWidth();
      var sceneHeight = $('#scene').innerHeight();

      var localPosition = calc.objToVector(
        this.origin,  
        geometryGraph, 
        THREE.Vector3);

      if (this.isGlobal) {
        var globalPosition = localPosition;
      } else {
        // Apply Workplane
        var workplaneOrigin = calc.objToVector(
          this.model.vertex.workplane.origin, 
          geometryGraph, 
          THREE.Vector3);
        var workplaneAxis =  calc.objToVector(
          this.model.vertex.workplane.axis, 
          geometryGraph, 
          THREE.Vector3);
        var workplaneAngle = geometryGraph.evaluate(this.model.vertex.workplane.angle);
        var globalPosition = calc.rotateAroundAxis(localPosition, workplaneAxis, workplaneAngle);
        globalPosition.add(workplaneOrigin);
      } 


      var screenPos = calc.toScreenCoordinates(sceneWidth, sceneHeight, camera, globalPosition);
        
      this.$el.css('left', (screenPos.x + 10) + 'px');
      this.$el.css('top',  (screenPos.y + 0) + 'px');
    },

  });

  return View;

});