define([
    'underscore',
    'geomnode',
    'geometrygraphsingleton',
    'asyncAPI',
  ],
  function(_, GeomNode, geometryGraph, AsyncAPI) {

    var Designer = function() {
    };

    Designer.prototype.createVariable = function(name, expression) {
      var variable = new GeomNode.Variable({
        name: name,
        parameters: {expression: expression},
      });
      geometryGraph.add(variable);
      return this.tryCommitCreate(variable);
    };

    Designer.prototype.updateVariable = function(original, name, expression) {
      var replacement = original.cloneNonEditing();
      replacement.name = name;
      replacement.parameters.expression = expression;
      geometryGraph.replace(original, replacement);
      return this.tryCommitEdit(original, replacement);
    };

    Designer.prototype.createPoint = function(x,y,z, options) {
      options = options || {};
      var point = new GeomNode.Point({});
      var parameters = {
        coordinate: {
          x: x,
          y: y,
          z: z,
        }
      };
      this.setColorOrMaterial(parameters, options);
      point.parameters = parameters;
      geometryGraph.add(point);
      return this.tryCommitCreate(point);
    };

    Designer.prototype.setColorOrMaterial = function(parameters, options) {
      if (options.texture) {
        parameters.material = {texture: options.texture};
      }
      if (options.color) {
        parameters.material = {color: options.color};
      }
    };

    Designer.prototype.updatePoint = function(original, x, y, z) {
      var replacement = original.cloneNonEditing();
      replacement.parameters.coordinate.x = x;
      replacement.parameters.coordinate.y = y;
      replacement.parameters.coordinate.z = z;
      geometryGraph.replace(original, replacement);
      return this.tryCommitEdit(original, replacement);
    };

    Designer.prototype.pointsFromCoordinatesOrPoints = function(coordinatesOrPoints) {
      if (!_.isArray(coordinatesOrPoints)) {
        throw new Error('parameter is not an array');
      }

      if (coordinatesOrPoints[0] instanceof GeomNode.Point) {
        return coordinatesOrPoints;
      } else {
        return coordinatesOrPoints.map(function(coordinate) {
          var point = new GeomNode.Point({implicit: true});
          point.parameters.coordinate.x = coordinate[0];
          point.parameters.coordinate.y = coordinate[1];
          point.parameters.coordinate.z = coordinate[2];
          geometryGraph.add(point);
          return point;
        });
      }
    };

    Designer.prototype.createPolyline = function(coordinatesOrPoints, options) {
      options = options || {};
      var points = this.pointsFromCoordinatesOrPoints(coordinatesOrPoints);
      var polyline = new GeomNode.Polyline();
      var parameters = {};
      this.setColorOrMaterial(parameters, options);
      polyline.parameters = parameters;
      geometryGraph.add(polyline, function() {
        points.forEach(function(point) {
          geometryGraph.addEdge(polyline, point);
        });
      });
      return this.tryCommitCreate(polyline);

    };

    Designer.prototype.getPoint = function(obj, index) {
      var points;
      if (obj instanceof GeomNode.Polyline) {
        points = geometryGraph.childrenOf(obj);
      }
      if (points === undefined) {
        throw new Error('unknown geometry type');
      }
      if ((index < 0) || (index > points.length-1)) {
        throw new Error('point index out of bounds [0,' + (points.length-1) + ']');
      }
      return points[index];

    };

    Designer.prototype.createExtrusion = function(coordinatesOrPointsOrPolyline, options) {
      options = options || {};
      var height = options.height || 10;
      var parameters = {
        height: height,
        vector: {
          u: 0,
          v: 0,
          w: 1,
        }
      };
      this.setColorOrMaterial(parameters, options);
      return this.createGeometryWithPolylineChild(
        coordinatesOrPointsOrPolyline,
        GeomNode.Extrude,
        parameters,
        true);
    };

    Designer.prototype.createGeometryWithPolylineChild = function(coordinatesOrPointsOrPolyline, Constructor, parameters, polylineExplicit) {
      var points, polyline;
      if (coordinatesOrPointsOrPolyline instanceof GeomNode.Polyline) {
        polyline = coordinatesOrPointsOrPolyline;
      } else {
        points = this.pointsFromCoordinatesOrPoints(coordinatesOrPointsOrPolyline);
        polyline = new GeomNode.Polyline({implicit: polylineExplicit ? false : true});
        geometryGraph.add(polyline, function() {
          points.forEach(function(point) {
            geometryGraph.addEdge(polyline, point);
          });
        });
      }

      var result = new Constructor({parameters: parameters});
      geometryGraph.add(result, function() {
        geometryGraph.addEdge(result, polyline);
      });
      return this.tryCommitCreate(result);
    };

    Designer.prototype.delete = function(vertex) {
      var result = AsyncAPI.tryCommitDelete(vertex);
      if (!result.error) {
        return 'ok';
      } else {
        throw new Error(result.error);
      }
    };

    Designer.prototype.tryCommitCreate = function(vertex) {
      var result = AsyncAPI.tryCommitCreate([vertex]);
      if (!result.error) {
        return vertex;
      } else {
        AsyncAPI.cancelCreate(vertex);
        throw new Error(result.error);
      }
    };

    Designer.prototype.tryCommitEdit = function(original, edited) {
      var result = AsyncAPI.tryCommitEdit([original], [edited]);
      if (!result.error) {
        return edited;
      } else {
        AsyncAPI.cancelEdit([edited], [original]);
        throw new Error(result.error);
      }
    };

    return Designer;

  });
