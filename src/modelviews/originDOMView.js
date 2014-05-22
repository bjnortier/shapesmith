define([
    'lib/mustache',
    'scene',
    'calculations',
    'geometrygraphsingleton',
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
        this.localPosition = calc.objToVector(
          this.origin,
          geometryGraph,
          THREE.Vector3);
        DimensionView.prototype.update.call(this);
      },

    });

    return View;

  });
