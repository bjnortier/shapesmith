define([
        'jquery',
        'lib/mustache',
        'calculations',
        'colors',
        'geometrygraphsingleton',
        'modelviews/geomvertexMV',
        'scene',
        'heightanchorview',
        'icons',
    ], 
    function(
        $, 
        Mustache,
        calc,
        colors,
        geometryGraph,
        GeomVertexMV,
        sceneModel,
        EditingHeightAnchor,
        icons) {

    // ---------- Common ----------

    var RenderExtrudeFacesMixin = {

        render: function() {
            GeomVertexMV.EditingSceneView.prototype.render.call(this);
            var polyline = _.first(geometryGraph.childrenOf(this.model.vertex));
            var points = geometryGraph.childrenOf(polyline);
            for (var i = 1; i < points.length; ++i) {
                // Need both normals for shadows
                this.renderPlaneForPoints(points[i], points[i-1]);
                this.renderPlaneForPoints(points[i-1], points[i]);
            }
        },

        renderPlaneForPoints: function(pointA, pointB) {

            var faceGeometry = new THREE.Geometry();
            var h = geometryGraph.evaluate(this.model.vertex.parameters.height);
            var a  = calc.objToVector(pointA.parameters.coordinate, geometryGraph, THREE.Vector3);
            var ah = a.clone().setZ(h + a.z);
            var b  = calc.objToVector(pointB.parameters.coordinate, geometryGraph, THREE.Vector3);
            var bh = b.clone().setZ(h + b.z);

            faceGeometry.vertices.push(a);
            faceGeometry.vertices.push(b);
            faceGeometry.vertices.push(bh);
            faceGeometry.vertices.push(ah);

            faceGeometry.faces.push(new THREE.Face4(0,1,2,3));
            var xyLength = 
                new THREE.Vector2(faceGeometry.vertices[0].x, faceGeometry.vertices[0].y)
                    .sub(new THREE.Vector2(faceGeometry.vertices[1].x, faceGeometry.vertices[1].y))
                    .length();
            var height = faceGeometry.vertices[2].z - faceGeometry.vertices[1].z;
            faceGeometry.faceVertexUvs[0].push([
                new THREE.Vector2(0,0),
                new THREE.Vector2(xyLength,0),
                new THREE.Vector2(xyLength,height),
                new THREE.Vector2(0,height),
            ]);
            faceGeometry.computeCentroids();
            faceGeometry.computeFaceNormals();

            var faceMaterial, edgeMaterial;
            if (this.model.vertex.editing) {
                faceMaterial = this.materials.editing.face;
                edgeMaterial = this.materials.editing.edge;
            } else {
                faceMaterial = this.materials.normal.face;
                edgeMaterial = this.materials.normal.edge;
            }

            var face = new THREE.Mesh(faceGeometry, faceMaterial);
            this.sceneObject.add(face);

            var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices.push(a);
            lineGeometry.vertices.push(b);
            lineGeometry.vertices.push(bh);
            lineGeometry.vertices.push(ah);
            lineGeometry.vertices.push(a);
            
            var line = new THREE.Line(lineGeometry, edgeMaterial);
            this.sceneObject.add(line);
        },
    }

    // ---------- Editing ----------

    var EditingModel = GeomVertexMV.EditingModel.extend({

        initialize: function(options) {
            GeomVertexMV.EditingModel.prototype.initialize.call(this, options);

            var polyline = geometryGraph.childrenOf(this.vertex)[0];
            var points = geometryGraph.childrenOf(polyline);
            for (var i = 0; i < points.length; ++i) {
                this.views.push(new EditingHeightAnchor({
                    model: this, 
                    pointVertex: points[i],
                    heightKey: 'height',
                }));
            }
            
            this.views.push(new EditingDOMView({model: this}));
            this.setMainSceneView(new EditingFacesSceneView({model: this}));
        },


        workplanePositionChanged: function(position) {
            // Do nothing
        },

        workplaneClick: function() {
            this.tryCommit();
        },

    });

    var EditingDOMView = GeomVertexMV.EditingDOMView.extend({

        render: function() {
            var template = 
                '<table><tr>' +
                '<td class="title">' + 
                '<div class="icon24">' + icons.extrude + '</div>' +
                '<div class="name">{{name}}</div>' + 
                '{{^implicit}}<div class="delete"></div>{{/implicit}}' + 
                '</td></tr><tr><td>' +
                '</div>' + 
                '<div class="coordinate">' + 
                'height <input class="field height" type="text" value="{{height}}"></input>' +
                '</div>' +
                '</td></tr></table>';
            var view = {
                name: this.model.vertex.name,
                height: this.model.vertex.parameters.height,
            };
            this.$el.html(Mustache.render(template, view));
            this.update();
            return this;
        },

        update: function() {
            this.$el.find('.field.height').val(    
                this.model.vertex.parameters.height);
        },

        updateFromDOM: function() {
            var expression = this.$el.find('.field.height').val();
            this.model.vertex.parameters.height = expression;
        }

    }); 

    var EditingFacesSceneView = GeomVertexMV.EditingSceneView.extend(RenderExtrudeFacesMixin);

    // ---------- Display ----------

    var DisplayModel = GeomVertexMV.DisplayModel.extend({

        initialize: function(options) {
            GeomVertexMV.DisplayModel.prototype.initialize.call(this, options);

            this.sceneView = new DisplayFacesSceneView({model: this});
            this.views.push(this.sceneView);
            this.views.push(new GeomVertexMV.DisplayDOMView({model: this}));
        },

        icon: icons.extrude,

    });

    var DisplayFacesSceneView = GeomVertexMV.DisplaySceneView.extend(RenderExtrudeFacesMixin);


    return {
        EditingModel: EditingModel,
        DisplayModel: DisplayModel,
    }

});