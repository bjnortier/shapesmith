define([
    'backbone',
    'jquery',
    'lib/mustache',
    'underscore',
    'colors',
    'scene',
    'interactioncoordinator',
    'scenevieweventgenerator',
    'worldcursor',
    'calculations',
    'modelviews/vertexMV',
    'hintview',
    'selection',
    'geometrygraphsingleton',
    'asyncAPI',
    'icons',
    'latheapi/adapter',
  ], function(
    Backbone,
    $, 
    Mustache,
    _,
    colors, 
    sceneModel,
    coordinator,
    sceneViewEventGenerator, 
    worldCursor, 
    calc,
    VertexMV,
    hintView,
    selection,
    geometryGraph,
    AsyncAPI,
    icons,
    latheAdapter) {

  // ---------- Common ----------

    var SceneView = VertexMV.SceneView.extend({

      initialize: function() {
        var normalColor = 0x6cbe32;
        var vertexMaterial = this.model.vertex.parameters.material;
        if (vertexMaterial && vertexMaterial.color) {
          normalColor = vertexMaterial.color;
        }
        this.materials = {
          normal: {
            face: new THREE.MeshLambertMaterial({
              color: normalColor,
              ambient: normalColor,
              name: 'normal.face'
            }),
            origin: new THREE.MeshLambertMaterial({
              color: normalColor,
              ambient: normalColor,
              name: 'normal.origin'
            }),
            wire: new THREE.MeshBasicMaterial({
              color: normalColor,
              wireframe: true,
              linewidth: 1,
              name: 'normal.wire'
            }),
            edge: new THREE.LineBasicMaterial({
              color: normalColor,
              linewidth: 2,
              name: 'normal.edge'
            }),
          },
          implicit: {
            face: new THREE.MeshLambertMaterial({
              color: 0xff0000,
              transparent: true,
              opacity: 0,
              name: 'implicit.face'
            }),
            origin: new THREE.MeshLambertMaterial({
              color: 0xff0000,
              transparent: true,
              opacity: 0,
              name: 'implicit.origin'
            }),
            wire: new THREE.MeshBasicMaterial({
              color: 0x000000,
              wireframe: true,
              transparent: true,
              opacity: 0,
              name: 'implicit.wire'
            }),
            edge: new THREE.LineBasicMaterial({
              color: 0x000000,
              transparent: true,
              opacity: 0,
              linewidth: 1,
              name: 'implicit.edge'
            }),
          },
          selected: {
            face: new THREE.MeshLambertMaterial({
              color: 0x999933,
              ambient: 0xffff99,
              // transparent: true,
              // opacity: 0.5,
              name: 'selected.face'
            }),
            origin: new THREE.MeshLambertMaterial({
              color: 0x999933,
              ambient: 0xffff99,
              // transparent: true,
              // opacity: 0.5,
              name: 'selected.origin'
            }),
            wire: new THREE.MeshBasicMaterial({
              color: 0x999933,
              wireframe: true,
              linewidth: 1,
              name: 'selected.wire'
            }),
            edge: new THREE.LineBasicMaterial({
              color: 0x999933,
              linewidth: 2,
              name: 'selected.edge'
            }),
          },
          unselected: {
            face: new THREE.MeshLambertMaterial({
              color: normalColor,
              ambient: normalColor,
              transparent: true,
              opacity: 0.5,
              name: 'unselected.face'
            }),
            origin: new THREE.MeshLambertMaterial({
              color: normalColor,
              ambient: normalColor,
              transparent: true,
              opacity: 0,
              name: 'unselected.origin'
            }),
            wire: new THREE.MeshBasicMaterial({
              color: normalColor,
              wireframe: true,
              linewidth: 1,
              name: 'unselected.wire'
            }),
            edge: new THREE.LineBasicMaterial({
              color: normalColor,
              linewidth: 2,
              name: 'unselected.edge'
            }),
          },
          editing: {
            face: new THREE.MeshLambertMaterial({
              color: 0x0099cc,
              transparent: true,
              opacity: 0.5,
              name: 'editing.face'
            }),
            origin: new THREE.MeshLambertMaterial({
              color: 0x000066,
              transparent: true,
              opacity: 0.8,
              name: 'editing.origin'
            }),
            wire: new THREE.MeshBasicMaterial({
              color: 0x007088,
              wireframe: true,
              linewidth: 1,
              name: 'editing.wire'
            }),
            edge: new THREE.LineBasicMaterial({
              color: 0x007088,
              linewidth: 2,
              name: 'editing.edge'
            }),
          },

        };
        
        VertexMV.SceneView.prototype.initialize.call(this);
        sceneModel.view.on('cameraMoveStopped', this.updateScreenBox, this);
      },

      remove: function() {
        VertexMV.SceneView.prototype.remove.call(this);
        sceneModel.view.off('cameraMoveStopped', this.updateScreenBox, this);
      },

      findObjects: function(sceneObjects) {
        var lines = [], meshes = [];
        var searchFn = function(obj) {
          if (obj.children.length) {
            obj.children.map(searchFn);
          }
          if (obj instanceof THREE.Mesh) {
            meshes.push(obj);
          } else if (obj instanceof THREE.Line) {
            lines.push(obj);
          }
        };
        sceneObjects.forEach(function(obj) {
          searchFn(obj);
        });
        return {lines: lines, meshes: meshes};
      },

      updateMaterials: function(key) {
        var objects = this.findObjects([this.sceneObject]);
        objects.lines.forEach(function(line) {
          line.material = this.materials[key].edge;
        }, this);
        objects.meshes.forEach(function(mesh) {
          if (mesh.material) {
            if (mesh.material.name.endsWith('face')) {
              mesh.material = this.materials[key].face;
            } else if (mesh.material.name.endsWith('wire')) {
              mesh.material = this.materials[key].wire;
            } else if (mesh.material.name.endsWith('origin')) {
              mesh.material = this.materials[key].origin;
            }
          }
        }, this);
        sceneModel.view.updateScene = true;
      },

      calculateScreenBox: function(boundingBox, sceneWidth, sceneHeight, camera) {
        var boundMin = boundingBox.min;
        var boundMax = boundingBox.max;
        var corners = [
          new THREE.Vector3(boundMin.x, boundMin.y, boundMin.z), // 000 
          new THREE.Vector3(boundMin.x, boundMin.y, boundMax.z), // 001
          new THREE.Vector3(boundMin.x, boundMax.y, boundMin.z), // 010
          new THREE.Vector3(boundMin.x, boundMax.y, boundMax.z), // 011 
          new THREE.Vector3(boundMax.x, boundMin.y, boundMin.z), // 100 
          new THREE.Vector3(boundMax.x, boundMin.y, boundMax.z), // 101 
          new THREE.Vector3(boundMax.x, boundMax.y, boundMin.z), // 110 
          new THREE.Vector3(boundMax.x, boundMax.y, boundMax.z), // 111 
        ];

        var screenBox = new THREE.Box2();

        corners.forEach(function(corner) {
          var screenPos = calc.toScreenCoordinates(sceneWidth, sceneHeight, camera, corner);
          screenBox.expandByPoint(new THREE.Vector2(
            Math.min(screenBox.min.x, screenPos.x - 5),
            Math.min(screenBox.min.y, screenPos.y - 5)));
          screenBox.expandByPoint(new THREE.Vector2(
            Math.max(screenBox.max.x, screenPos.x + 5),
            Math.max(screenBox.max.y, screenPos.y + 5)));
        }, this);

        return screenBox;
      },

      updateScreenBox: function(camera) {
        if (this.preventScreenBoxUpdate) {
          return;
        }

        var sceneWidth = $('#scene').innerWidth();
        var sceneHeight = $('#scene').innerHeight();

        var that = this;
        var updateScreenBoxForObj = function(obj) {
          if (obj.geometry) {
            obj.screenBox = that.calculateScreenBox(
              obj.geometry.boundingBox, sceneWidth, sceneHeight, camera);
          }
          if (obj.children && (obj.children.length > 0)) {
            obj.children.map(updateScreenBoxForObj);
          }
        };
        updateScreenBoxForObj(this.sceneObject);
      },


      csgToMesh: function(csg) {
        var geometry = new THREE.Geometry();
        var indices = [];
        var box3 = new THREE.Box3();

        var workplaneAxis = calc.objToVector(
            this.model.vertex.workplane.axis, 
            geometryGraph, 
            THREE.Vector3);
        var workplaneAngle = geometryGraph.evaluate(this.model.vertex.workplane.angle);
        var workplaneOrigin = calc.objToVector(
              this.model.vertex.workplane.origin, 
              geometryGraph, 
              THREE.Vector3);

        csg.polygons.forEach(function(polygon) {

          var polygonIndices = polygon.vertices.map(function(v) {
            var vertex = new THREE.Vector3(v.pos.x, v.pos.y, v.pos.z);

            var localVertex = vertex.clone();
            localVertex.sub(workplaneOrigin);
            localVertex = calc.rotateAroundAxis(localVertex, workplaneAxis, -workplaneAngle);
            box3.expandByPoint(localVertex);

            return geometry.vertices.push(vertex) - 1;
          });

          if (polygonIndices.length === 3) {
            geometry.faces.push(new THREE.Face3(polygonIndices[0], polygonIndices[1], polygonIndices[2]));
          } else if (polygonIndices.length === 4) {
            geometry.faces.push(new THREE.Face4(polygonIndices[0], polygonIndices[1], polygonIndices[2], polygonIndices[3]));
          } else {
            // Only support convex polygons
            geometry.faces.push(new THREE.Face3(polygonIndices[0],polygonIndices[1],polygonIndices[2]));
            for (var j = 2; j < polygonIndices.length -1; ++j) {
              geometry.faces.push(new THREE.Face3(polygonIndices[0], polygonIndices[0]+j,polygonIndices[0]+j+1));
            }
          }
          indices.push(polygonIndices);
          
        }, this);

        geometry.computeFaceNormals();
        return {
          geometry: geometry, 
          indices: indices,
          box3: box3,
        };
      },

      createMesh: function(callback) {
        var vertex = this.model.vertex;
        latheAdapter.generate(
          vertex,
          function(err, result) {

          if (err) {
            console.error('no mesh', vertex.id);
            return;
          } else if(callback) {
            callback(result);
          }
          
        });
      },

      createUntransformedMesh: function(callback) {
        var vertex = this.model.vertex.cloneEditing();
        vertex.transforms = {
          rotation : {
            origin: {
              x: 0,
              y: 0,
              z: 0,
            },
            axis: {
              x: 0,
              y: 0,
              z: 1,
            },
            angle: 0,
          },
          translation: {
            x: 0,
            y: 0,
            z: 0,
          },
          scale: {
            origin: {
              x: 0,
              y: 0,
              z: 0,
            },
            factor: 1, 
          }
        };
        latheAdapter.generate(
          vertex,
          function(err, result) {

          if (err) {
            console.error('no mesh', vertex.id);
            return;
          } else if(callback) {
            callback(result);
          }
          
        });
      },

      render: function() {
        VertexMV.SceneView.prototype.render.call(this);

        if (!this.isGlobal) {
          var quaternion = new THREE.Quaternion();
          var axis = calc.objToVector(
              this.model.vertex.workplane.axis, 
              geometryGraph, 
              THREE.Vector3);
          var angle = geometryGraph.evaluate(this.model.vertex.workplane.angle)/180*Math.PI;

          quaternion.setFromAxisAngle(axis, angle);
          this.sceneObject.useQuaternion = true;
          this.sceneObject.quaternion = quaternion;

          this.sceneObject.position = 
            calc.objToVector(
              this.model.vertex.workplane.origin, 
              geometryGraph, 
              THREE.Vector3);
        }

      },

      renderMesh: function(result) {
        if (this.model.inContext) {
          this.clear();
          var toMesh;
          if (result.csg) {
            toMesh = this.csgToMesh(result.csg);
          } else {
            toMesh = this.polygonsToMesh(result.polygons);
          }

          this.extents = {
            center: toMesh.box3.center(),
            dx: toMesh.box3.max.x - toMesh.box3.center().x,
            dy: toMesh.box3.max.y - toMesh.box3.center().y,
            dz: toMesh.box3.max.z - toMesh.box3.center().z,
          };

          var faceGeometry = toMesh.geometry;
          var faceMaterial;
          if (this.model.vertex.editing) {
            if (this.model.vertex.transforming) {
              faceMaterial = this.materials.selected.face;
            } else {
              faceMaterial = this.materials.editing.face;
            }
          } else {
            faceMaterial = this.materials.normal.face;
          }
          this.meshObject = new THREE.Mesh(faceGeometry, faceMaterial);

          // Debug - show edges
          // var meshObject = THREE.SceneUtils.createMultiMaterialObject(faceGeometry, [
          //   faceMaterial,
          //   new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true, linewidth: 5}),
          // ]);

          this.sceneObject.add(this.meshObject);
          sceneModel.view.updateScene = true;

          this.updateAppearance();
        }
      },

    });


    // ---------- Editing ----------

    var EditingModel = VertexMV.EditingModel.extend({

      initialize: function(options) {
        this.parentModel = options.parentModel;
        VertexMV.EditingModel.prototype.initialize.call(this, options);
        this.hintView = hintView;
        

        worldCursor.on('positionChanged', this.workplanePositionChanged, this);
        worldCursor.on('click', this.workplaneClick, this);
        worldCursor.on('dblclick', this.workplaneDblClick, this);
        coordinator.on('keyup', this.keyup, this);
        sceneViewEventGenerator.on('sceneViewClick', this.sceneViewClick, this);
        sceneViewEventGenerator.on('sceneViewDblClick', this.sceneViewDblClick, this);
        geometryGraph.on('vertexReplaced', this.vertexReplaced, this);
      },

      destroy: function() {
        VertexMV.EditingModel.prototype.destroy.call(this);
        this.hintView.clear();
        worldCursor.off('positionChanged', this.workplanePositionChanged, this);
        worldCursor.off('click', this.workplaneClick, this);
        worldCursor.off('dblclick', this.workplaneDblClick, this);
        coordinator.off('keyup', this.keyup, this);
        sceneViewEventGenerator.off('sceneViewClick', this.sceneViewClick, this);
        sceneViewEventGenerator.off('sceneViewDblClick', this.sceneViewDblClick, this);
        geometryGraph.off('vertexReplaced', this.vertexReplaced, this);
      },  

      keyup: function(event) {
        // Delete
        if (!this.vertex.implicit && (event.keyCode === 46)) {
          this.tryDelete();
        }
      },

      // Update the workplane is it changes during editing
      vertexReplaced: function(original, replacement) {
        if (replacement.type === 'workplane') {
          this.vertex.workplane = calc.copyObj(replacement.workplane);
        }
      },

      rotate: function(origin, axisAngle) {
        this.vertex.transforms.rotation.origin.x = origin.x;
        this.vertex.transforms.rotation.origin.y = origin.y;
        this.vertex.transforms.rotation.origin.z = origin.z;
        this.vertex.transforms.rotation.axis.x = parseFloat(axisAngle.axis.x.toFixed(3));
        this.vertex.transforms.rotation.axis.y = parseFloat(axisAngle.axis.y.toFixed(3));
        this.vertex.transforms.rotation.axis.z = parseFloat(axisAngle.axis.z.toFixed(3));
        this.vertex.transforms.rotation.angle  = parseFloat(axisAngle.angle.toFixed(2));
        this.vertex.trigger('change', this.vertex);
      },

    });

    var EditingDOMView = VertexMV.EditingDOMView.extend({

      initialize: function(options) {
        VertexMV.EditingDOMView.prototype.initialize.call(this, options);
        if (options.appendDomElement) {
          options.appendDomElement.append(this.$el);
        } else if (options.replaceDomElement) {
          options.replaceDomElement.replaceWith(this.$el);
        }
        this.toggleTransforms();
      },

      render: function() {
        this.beforeTemplate = 
          '{{^implicit}}' +
          '<div class="title">' + 
          '<div class="icon24">{{{icon}}}</div>' +
          '<div class="name">{{name}}</div>' + 
          '<div class="actions">' +
            '{{#isTopLevel}}' +
            // '<i class="showhide icon-eye-open"></i>' +
            '<i class="delete icon-remove"></i>' +
            '{{/isTopLevel}}' +
          '</div>' +
          '{{/implicit}}' +
          '</div>' + 
          '<div class="children {{id}}"></div>';
        this.afterTemplate = this.model.vertex.implicit ? '' : 
          // '<div class="workplane">' +
          //   '<div class="origin">' +
          //     '<div>x <input class="field workplane.origin.x" type="text" value="{{workplane.origin.x}}"></input></div>' +
          //     '<div>y <input class="field workplane.origin.y" type="text" value="{{workplane.origin.y}}"></input></div>' +
          //     '<div>z <input class="field workplane.origin.z" type="text" value="{{workplane.origin.z}}"></input></div>' +     
          //   '</div>' +
          // '</div>' +
          '<div class="transforms">' +
            '<div class="expander"><i class="arrow icon-caret-down"></i>transforms<i class="clear icon-remove"></i></div>' +
            // '<div>centerx <input class="field centerx" type="text" value="{{center.x}}"></input></div>' +
            // '<div>centery <input class="field centery" type="text" value="{{center.y}}"></input></div>' +
            // '<div>centerz <input class="field centerz" type="text" value="{{center.z}}"></input></div>' + 
            '<div class="parameter">axisx <input class="field axisx" type="text" value="{{axis.x}}"></input></div>' +
            '<div class="parameter">axisy <input class="field axisy" type="text" value="{{axis.y}}"></input></div>' +
            '<div class="parameter">axisz <input class="field axisz" type="text" value="{{axis.z}}"></input></div>' + 
            '<div class="parameter">angle <input class="field angle" type="text" value="{{angle}}"></input></div>' +
            '<div class="parameter">scale <input class="field scale" type="text" value="{{scale}}"></input></div>' +
          '</div>';

        var rotation = this.model.vertex.transforms.rotation;
        // var workplane = this.model.vertex.workplane;
        this.baseView = {
          id: this.model.vertex.id,
          name : this.model.vertex.name,
          implicit: this.model.vertex.implicit,
          icon: icons[this.model.vertex.type],
          isTopLevel: !geometryGraph.parentsOf(this.model.vertex).length,
          // workplane: this.model.vertex.workplane,
          center: {
            x: rotation.origin.x,
            y: rotation.origin.y,
            z: rotation.origin.z,
          },
          axis: { 
            x: rotation.axis.x,
            y: rotation.axis.y,
            z: rotation.axis.z,
          },
          angle: rotation.angle,
          scale: this.model.vertex.transforms.scale.factor,
        };
      },

      events: function() {
        var vertexEvents = VertexMV.EditingDOMView.prototype.events.call(this);
        return _.extend(vertexEvents, {
          'click .transforms .expander' : 'toggleTransforms',
          'click .transforms .clear' : 'clearTransforms',
        });
      },

      remove: function() {
        VertexMV.EditingDOMView.prototype.remove.call(this);
      },

      toggleTransforms: function(event) {
        if (event) {
          event.stopPropagation();
        }
        this.$el.find('.transforms .parameter').toggle();
        var toggleIcon = this.$el.find('.transforms i.arrow');
        if (toggleIcon.hasClass('icon-caret-right')) {
          toggleIcon.removeClass('icon-caret-right');
          toggleIcon.addClass('icon-caret-down');
        } else {
          toggleIcon.removeClass('icon-caret-down');
          toggleIcon.addClass('icon-caret-right');
        }
      },

      clearTransforms: function(event) {
        event.stopPropagation();
        this.model.vertex.transforms.translation.x = 0;
        this.model.vertex.transforms.translation.y = 0;
        this.model.vertex.transforms.translation.z = 0;
        this.model.vertex.transforms.rotation.axis.x = 0;
        this.model.vertex.transforms.rotation.axis.y = 0;
        this.model.vertex.transforms.rotation.axis.z = 1;
        this.model.vertex.transforms.rotation.angle = 0;
        this.model.vertex.transforms.scale.factor = 1;
        this.model.vertex.trigger('change', this.model.vertex);
      },

      update: function() {
        var rotation = this.model.vertex.transforms.rotation;
        var scale = this.model.vertex.transforms.scale.factor;
        ['x', 'y', 'z'].forEach(function(key) {
          this.$el.find('.field.axis' + key).val(rotation.axis[key]);
        }, this);
        this.$el.find('.field.angle').val(rotation.angle);
        this.$el.find('.field.scale').val(scale);
      },

      updateFromDOM: function() {
        ['x', 'y', 'z'].forEach(function(key) {
          var field = this.$el.find('.field.axis' + key);
          this.updateFromField(field, this.model.vertex.transforms.rotation.axis, key);
        }, this);

        this.updateFromField(
          this.$el.find('.field.angle'),
          this.model.vertex.transforms.rotation,
          'angle');

        this.updateFromField(
          this.$el.find('.field.scale'),
          this.model.vertex.transforms.scale,
          'factor');
      }

    });
    

    var EditingSceneView = SceneView.extend({

      initialize: function() {
        SceneView.prototype.initialize.call(this);
        this.model.vertex.on('change', this.renderIfInContext, this);
      },

      remove: function() {
        SceneView.prototype.remove.call(this);
        this.model.vertex.off('change', this.renderIfInContext, this);
      },

      updateAppearance: function() {
      },

    });

    // ---------- Display ----------

    var DisplayModel = VertexMV.DisplayModel.extend({ 

      initialize: function(options) {
        this.DOMView = DisplayDOMView;
        VertexMV.DisplayModel.prototype.initialize.call(this, options);
        coordinator.on('keyup', this.keyup, this);
        worldCursor.on('click', this.workplaneClick, this);
      },

      destroy: function() {
        VertexMV.DisplayModel.prototype.destroy.call(this);
        coordinator.off('keyup', this.keyup, this);
        worldCursor.off('click', this.workplaneClick, this);
      },


      canSelect: function() {
        return !this.vertex.implicit && this.inContext && !this.selected;
      },

      keyup: function(event) {
        if (!this.vertex.implicit && (event.keyCode === 46)) {
          if (this.get('selected')) {
            this.tryDelete();
          }
        }
      },

      workplaneClick: function() {
        selection.deselectAll();
      },

      getExtents: function() {
        return this.sceneView.extents;
      },

    });

    var DisplayDOMView = VertexMV.DisplayDOMView.extend({

      className: 'vertex display',

      initialize: function(options) {
        VertexMV.DisplayDOMView.prototype.initialize.call(this, options);
        this.$el.addClass(this.model.vertex.name);  
        if (options.appendDomElement) {
          options.appendDomElement.append(this.$el);
        } else if (options.replaceDomElement) {
          options.replaceDomElement.replaceWith(this.$el);
        }
        this.model.on('change:selected', this.updateSelected, this);
      },

      remove: function() {
        VertexMV.DisplayDOMView.prototype.remove.call(this);
        this.model.off('change:selected', this.updateSelected, this);
      },

      render: function() {
        if (!this.model.vertex.implicit) {
          var parameters = this.model.vertex.parameters;
          var color = (parameters.material && parameters.material.color) || '#6cbe32';
          var hasExplicitChildren = !!_.find(
            geometryGraph.childrenOf(this.model.vertex),
            function(child) {
              return !child.implicit && (child.type !== 'variable');
            });
          var view = {
            id:   this.model.vertex.id,
            name: this.model.vertex.name,
            type: this.model.vertex.type,
            color: color,
            icon: icons[this.model.vertex.type],
            isTopLevel: !geometryGraph.parentsOf(this.model.vertex).length,
            hasExplicitChildren: hasExplicitChildren,
          };
          var template = 
            '<div class="title">' + 
              '{{#hasExplicitChildren}}' +
              '<i class="dive icon-chevron-sign-down"></i>' +
              '<i class="ascend icon-chevron-sign-up"></i>' +
              '{{/hasExplicitChildren}}' +  
              '<div class="icon24" style="fill: {{color}}; stroke: {{color}};">{{{icon}}}</div>' +
              '<div class="name">{{name}}</div>' + 
              '<div class="actions">' +
                // '<i class="showhide icon-eye-open"></i>' +
                '<i title="delete" class="delete icon-remove"></i>' +
                '<i title="copy" class="copy icon-copy"></i>' +
              '</div>' +
            '</div>' +
            '<div class="children {{id}}"></div>';
          this.$el.html(
            Mustache.render(template, view));
          return this;
        } else {
          this.$el.html();
        }
      },  

      updateSelected: function() {
        if (this.model.get('selected')) {
          this.$el.addClass('selected');
        } else {
          this.$el.removeClass('selected');
        }
      }, 

      events: {
        'click > .title .icon24'   : 'clickTitle',
        'click > .title .name'   : 'clickTitle',
        'dblclick > .title .name': 'dblclickTitle',
        'dblclick > .title .icon24': 'dblclickTitle',
        'click > .title > .actions > .delete'  : 'delete',
        'click > .title > .actions > .copy'  : 'copy',
        'click > .title > .dive'  : 'clickDive',
        'click > .title > .ascend'  : 'clickAscend',
      },

      clickDive: function(event) {
        event.stopPropagation();
        selection.deselectAll();
        this.trigger('dive');
        this.dive();
      },

      clickAscend: function(event) {
        event.stopPropagation();
        selection.deselectAll();
        this.trigger('ascend');
        this.ascend();
      },

      ascend: function() {
        this.$el.removeClass('dived');
        var parameters = this.model.vertex.parameters;
        var color = (parameters.material && parameters.material.color) || '#6cbe32';
        this.$el.find('> .title > .icon24').attr(
          "style", 
          
          Mustache.render("fill: {{color}}; stroke: {{color}}", {color: color}));
      },

      dive: function() {
        this.$el.addClass('dived');
        var color = "#bbb";
        this.$el.find('> .title > .icon24').attr(
          "style", 
          
          Mustache.render("fill: {{color}}; stroke: {{color}}", {color: color}));
      },

      clickTitle: function(event) {
        event.stopPropagation();
        if (this.model.canSelect()) {
          if (event.shiftKey) {
            selection.addToSelection(this.model.vertex.id);
          } else {
            selection.selectOnly(this.model.vertex.id);
          }
        }
      },

      dblclickTitle: function(event) {
        event.stopPropagation();
        if (!geometryGraph.isEditing() && this.model.inContext &&  !this.model.vertex.implicit) {
          selection.deselectAll();
          AsyncAPI.edit(this.model.vertex);
        }
      },

      delete: function(event) {
        event.stopPropagation();
        this.model.tryDelete();
      },

      copy: function(event) {
        event.stopPropagation();
        this.model.tryCopy();
      },

    });

    var DisplaySceneView = SceneView.extend({

      initialize: function() {
        SceneView.prototype.initialize.call(this);
        this.on('click', this.click, this);
        this.on('dblclick', this.dblclick, this);
        this.model.vertex.on('change', this.renderIfInContext, this);
        this.model.on('change:selected', this.updateSelected, this);
        this.model.on('postSelection', this.updateAppearance, this);
        geometryGraph.on('vertexAdded', this.updateAppearance, this);
        geometryGraph.on('vertexReplaced', this.updateAppearance, this);
        geometryGraph.on('vertexRemoved', this.updateAppearance, this);
      },

      remove: function() {
        SceneView.prototype.remove.call(this);
        this.off('click', this.click, this);
        this.off('dblclick', this.dblclick, this);
        this.model.vertex.off('change', this.renderIfInContext, this);
        this.model.off('change:selected', this.updateSelected, this);
        this.model.off('postSelection', this.updateAppearance, this);
        geometryGraph.off('vertexAdded', this.updateAppearance, this);
        geometryGraph.off('vertexReplaced', this.updateAppearance, this);
        geometryGraph.off('vertexRemoved', this.updateAppearance, this);
      },

      isClickable: function() {
        return true;
      },

      updateSelected: function() {
      },

      updateAppearance: function() {
        if (selection.getSelected().length || geometryGraph.isEditing()) {
          if (this.model.get('selected')) {
            this.updateMaterials('selected');
          } else {
            this.updateMaterials('unselected');
          }
        } else {
          if (this.model.vertex.implicit) {
            this.updateMaterials('implicit');
          } else {
            this.updateMaterials('normal');
          }
        }
      },

      click: function(event) {
        if (this.model.canSelect()) {
          var vertexToSelect = this.model.vertex;
          if (vertexToSelect) {
            if (event.shiftKey) {
              selection.addToSelection(vertexToSelect.id);
            } else {
              selection.selectOnly(vertexToSelect.id);
            }
          }
        }
      },

      dblclick: function() {
        if (!geometryGraph.isEditing() && !this.model.vertex.implicit) {
          selection.deselectAll();
          AsyncAPI.edit(this.model.vertex);
        }
      },

      isDraggable: function() {
        // Can translate if this is the only selected object
        var selected = selection.getSelected();
        var draggable = ((selected.length === 1) && (selected[0] === this.model.vertex.id));
        return draggable;
      },

    });

    // ---------- Module ----------

    return {
      SceneView       : SceneView,
      EditingModel    : EditingModel,
      EditingDOMView  : EditingDOMView,
      EditingSceneView: EditingSceneView,
      DisplayModel    : DisplayModel, 
      DisplayDOMView  : DisplayDOMView,
      DisplaySceneView: DisplaySceneView,
    };

  });
