define([
    'jquery',
    'lib/mustache',
    'underscore',
    'calculations',
    'worldcursor',
    'scene',
    'geometrygraphsingleton',
    'modelviews/geomvertexMV',
  ],
  function(
    $,
    Mustache,
    _,
    calc,
    worldCursor,
    sceneModel,
    geometryGraph,
    GeomVertexMV) {

    // ---------- Editing ----------

    var EditingModel = GeomVertexMV.EditingModel.extend({

      initialize: function(options) {
        this.DOMView = EditingDOMView;
        this.SceneView = EditingSceneView;
        GeomVertexMV.EditingModel.prototype.initialize.call(this, options);
      },

      workplaneClick: function() {
        if (!this.vertex.proto) {
          this.tryCommit();
        }
      },

      translate: function(translation) {
        if (!this.startOrigin) {
          this.startOrigin = {
            x: geometryGraph.evaluate(this.vertex.transforms.translation.x),
            y: geometryGraph.evaluate(this.vertex.transforms.translation.y),
            z: geometryGraph.evaluate(this.vertex.transforms.translation.z),
          };
          this.startRotationCenter = {
            x: geometryGraph.evaluate(this.vertex.transforms.rotation.origin.x),
            y: geometryGraph.evaluate(this.vertex.transforms.rotation.origin.y),
            z: geometryGraph.evaluate(this.vertex.transforms.rotation.origin.z),
          };
        }
        this.vertex.transforms.translation =  {
          x: this.startOrigin.x + translation.x,
          y: this.startOrigin.y + translation.y,
          z: this.startOrigin.z + translation.z,
        };
        this.vertex.transforms.rotation.origin =  {
          x: '(' + this.startRotationCenter.x + ') + (' + translation.x + ')',
          y: '(' + this.startRotationCenter.y + ') + (' + translation.y + ')',
          z: '(' + this.startRotationCenter.z + ') + (' + translation.z + ')',
        };
        this.vertex.trigger('change', this.vertex);
      },

      scale: function(origin, factor) {
        this.vertex.transforms.scale.origin.x = origin.x;
        this.vertex.transforms.scale.origin.y = origin.y;
        this.vertex.transforms.scale.origin.z = 0;
        this.vertex.transforms.scale.factor = factor;
        this.vertex.trigger('change', this.vertex);
      },

      rotate: function(origin, axisAngle) {
        GeomVertexMV.EditingModel.prototype.rotate.call(this, origin, axisAngle);
      },

    });

    var EditingDOMView = GeomVertexMV.EditingDOMView.extend({

      render: function() {
        GeomVertexMV.EditingDOMView.prototype.render.call(this);
        var translationHtml = '<div class="parameter">dx<input class="field dx" type="text" value="{{dx}}"></input></div>' +
          '<div class="parameter">dy<input class="field dy" type="text" value="{{dy}}"></input></div>' +
          '<div class="parameter">dz<input class="field dz" type="text" value="{{dz}}"></input></div>';
        var template = this.beforeTemplate + this.afterTemplate;
        template = template.replace('icon-remove"></i></div>', 'icon-remove"></i></div>' + translationHtml);

        var translation = this.model.vertex.transforms.translation;
        var view = _.extend(this.baseView, {
          dx     : translation.x,
          dy     : translation.y,
          dz     : translation.z,
        });
        this.$el.html(Mustache.render(template, view));
        return this;
      },

      update: function() {
        GeomVertexMV.EditingDOMView.prototype.update.call(this);

        var that = this;
        var translate = this.model.vertex.transforms.translation;
        ['x', 'y', 'z'].forEach(function(key) {
          that.$el.find('.field.d' + key).val(translate[key]);
        });
      },

      updateFromDOM: function() {
        GeomVertexMV.EditingDOMView.prototype.updateFromDOM.call(this);
        var translate = this.model.vertex.transforms.translation;
        ['x', 'y', 'z'].forEach(function(key) {
          var field = this.$el.find('.field.d' + key);
          this.updateFromField(field, translate, key);
        }, this);
      },

    });

    var EditingSceneView = GeomVertexMV.EditingSceneView.extend({


      render: function() {
        // Only render it once, and render it *without* transforms
        if (!this.isFirst) {
          GeomVertexMV.EditingSceneView.prototype.render.call(this);
          this.isFirst = true;
          var that = this;
          this.createUntransformedMesh(function(result) {
            that.renderMesh(result);
            that.applyTransforms();
          });
        } else {
          if (this.meshObject) {
            this.applyTransforms();
          }
        }
      },

      applyTransforms: function() {
        if (!this.meshObject) {
          return;
        }

        var translation = calc.objToVector(
          this.model.vertex.transforms.translation,
          geometryGraph,
          THREE.Vector3);

        var rotationOrigin = calc.objToVector(
          this.model.vertex.transforms.rotation.origin,
          geometryGraph,
          THREE.Vector3);

        var rotationQuat = new THREE.Quaternion().setFromAxisAngle(
          calc.objToVector(this.model.vertex.transforms.rotation.axis, geometryGraph, THREE.Vector3),
            geometryGraph.evaluate(this.model.vertex.transforms.rotation.angle)/180*Math.PI);

        var scaleOrigin = calc.objToVector(
          this.model.vertex.transforms.scale.origin,
          geometryGraph,
          THREE.Vector3);

        var factor = geometryGraph.evaluate(this.model.vertex.transforms.scale.factor);

        var workplaneOrigin = calc.objToVector(
          this.model.vertex.workplane.origin,
          geometryGraph,
          THREE.Vector3);

        var workplaneQuat = new THREE.Quaternion().setFromAxisAngle(
          calc.objToVector(this.model.vertex.workplane.axis, geometryGraph, THREE.Vector3),
            geometryGraph.evaluate(this.model.vertex.workplane.angle)/180*Math.PI);

        var matrices = [
          new THREE.Matrix4().makeTranslation(-workplaneOrigin.x, -workplaneOrigin.y, -workplaneOrigin.z),
          new THREE.Matrix4().setRotationFromQuaternion(workplaneQuat.clone().inverse()),
          new THREE.Matrix4().makeTranslation(translation.x, translation.y, translation.z),
          new THREE.Matrix4().makeTranslation(-rotationOrigin.x, -rotationOrigin.y, -rotationOrigin.z),
          new THREE.Matrix4().setRotationFromQuaternion(rotationQuat),
          new THREE.Matrix4().makeTranslation(rotationOrigin.x, rotationOrigin.y, rotationOrigin.z),
          new THREE.Matrix4().makeTranslation(-scaleOrigin.x, -scaleOrigin.y, -scaleOrigin.z),
          new THREE.Matrix4().makeScale(factor, factor, factor),
          new THREE.Matrix4().makeTranslation(scaleOrigin.x, scaleOrigin.y, scaleOrigin.z),
          new THREE.Matrix4().setRotationFromQuaternion(workplaneQuat),
          new THREE.Matrix4().makeTranslation(workplaneOrigin.x, workplaneOrigin.y, workplaneOrigin.z),
        ];

        var result = matrices.reduce(function(acc, m) {
          return m.multiply(acc);
        }, new THREE.Matrix4());

        this.meshObject.matrix = new THREE.Matrix4();
        this.meshObject.applyMatrix(result);
        sceneModel.view.updateScene = true;

      }


    });

    // ---------- Display ----------

    var DisplayModel = GeomVertexMV.DisplayModel.extend({

      initialize: function(options) {
        this.SceneView = DisplaySceneView;
        GeomVertexMV.DisplayModel.prototype.initialize.call(this, options);
      },

      destroy: function() {
        GeomVertexMV.DisplayModel.prototype.destroy.call(this);
      },

    });

    var DisplaySceneView = GeomVertexMV.DisplaySceneView.extend({

      render: function() {
        GeomVertexMV.DisplaySceneView.prototype.render.call(this);
        var that = this;
        this.createMesh(function(result) {
          that.renderMesh(result);
        });
      },

    });

    // ---------- Module ----------

    return {
      DisplayModel: DisplayModel,
      EditingModel: EditingModel,
    };

  });
