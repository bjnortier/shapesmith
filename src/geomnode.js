define([
    'underscore',
    'backbone-events',
    'calculations',
  ], function(_, Events, calc) {

    var counters = {};
    var idsUsed = [];

    var validateIdOrName = function(idOrName) {
      var re = /^[a-zA-Z][a-zA-Z0-9_]*$/;
      if (!re.exec(idOrName)) {
        throw new Error('invalid id or name: ' + idOrName + '. Must match ^[a-zA-Z][a-zA-Z0-9_]+$');
      }
    };

    var validateIdIsUnique = function(id) {
      if (idsUsed.indexOf(id) !== -1) {
        throw new Error('Id ' + id + ' already used');
      }
    };

    var getNextId= function(type) {
      if (!counters[type]) {
        counters[type] = 0;
      }
      var potentialId;
      do {
        potentialId = type + counters[type];
        ++counters[type];
      } while (idsUsed.indexOf(potentialId) !== -1);
      return potentialId;
    };

    var GeomNode = function(options) {
      _.extend(this, Events);
      options = options || {};

      if (!options.hasOwnProperty('type')) {
        throw new Error('No type');
      }
      this.type = options.type;

      if (options.hasOwnProperty('id')) {
        validateIdOrName(options.id);
        if (!options.isClone) {
          validateIdIsUnique(options.id);
        }
        this.id = options.id;
      } else {
        this.id = getNextId(options.type);
      }
      idsUsed.push(this.id);

      if (options.hasOwnProperty('name')) {
        validateIdOrName(options.name);
        this.name = options.name;
      } else {
        this.name = this.id;
      }

      this.implicit = options.implicit || false;

      this.workplane = options.workplane || {
        origin: {x: 0, y:0, z: 0},
        axis  : {x: 0, y: 0, z: 1},
        angle : 0,
      };
      this.transforming = options.transforming || false;
      this.rotating = options.rotating || false;
      this.transforms = options.transforms || {
        rotation: {
          origin: {x: 0, y:0, z: 0},
          axis  : {x: 0, y:0, z:1},
          angle : 0,
        },
        translation: {x: 0, y:0, z:0},
        scale: {
          origin: {x: 0, y:0, z: 0},
          factor: 1,
        }
      };
      this.parameters = options.parameters || {};
      this.editing = options.editing || false;
      this.proto = options.proto || false;
      this.category = options.category;
      this.timestamp = new Date().getTime();
    };

    var resetIDCounters = function() {
      counters = {};
      idsUsed = [];
    };

    GeomNode.prototype.cloneNonEditing = function(options) {
      options = options || {};
      var cloneOptions = _.extend(options, {
        type        : this.type,
        id          : this.id,
        isClone     : true,
        name        : this.name,
        implicit    : this.implicit,
        transforms  : calc.copyObj(this.transforms),
        workplane   : calc.copyObj(this.workplane),
        parameters  : calc.copyObj(this.parameters),
        inContext   : this.inContext,
      });
      var newNode = new this.constructor(cloneOptions);
      return newNode;
    };

    GeomNode.prototype.cloneEditing = function() {
      var newNode = this.cloneNonEditing();
      newNode.editing = true;
      newNode.transforming = this.transforming;
      newNode.rotating = this.rotating;
      return newNode;
    };

    GeomNode.prototype.copy = function() {
      var copyOptions = {
        type        : this.type,
        implicit    : this.implicit,
        transforms  : calc.copyObj(this.transforms),
        workplane   : calc.copyObj(this.workplane),
        parameters  : calc.copyObj(this.parameters),
        inContext   : this.inContext,
      };
      return new this.constructor(copyOptions);
    };

    GeomNode.prototype.validateSchema = function() {
      return {};
    };

    // Strip for serialization
    var strip = function(obj) {
      return {
        id        : obj.id,
        type      : obj.type,
        name      : obj.name,
        implicit  : obj.implicit,
        workplane : obj.workplane,
        transforms: obj.transforms,
        parameters: obj.parameters,
      };
    };

    // ---------- Types ----------

    // ---------- Workplane ----------

    var Workplane = function(options) {
      options = options || {};
      options.type = 'workplane';
      options.parameters = options.parameters || {gridsize: 1.0};
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(Workplane.prototype, GeomNode.prototype);

    var getCommonExpressions = function(vertex) {
      return {

        'workplane.origin.x' : vertex.workplane.origin.x,
        'workplane.origin.y' : vertex.workplane.origin.y,
        'workplane.origin.z' : vertex.workplane.origin.z,
        'workplane.axis.x'   : vertex.workplane.axis.x,
        'workplane.axis.y'   : vertex.workplane.axis.y,
        'workplane.axis.z'   : vertex.workplane.axis.z,
        'workplane.angle'    : vertex.workplane.angle,

        'transforms.rotation.origin.x' : vertex.transforms.rotation.origin.x,
        'transforms.rotation.origin.y' : vertex.transforms.rotation.origin.y,
        'transforms.rotation.origin.z' : vertex.transforms.rotation.origin.z,
        'transforms.rotation.axis.x'   : vertex.transforms.rotation.axis.x,
        'transforms.rotation.axis.y'   : vertex.transforms.rotation.axis.y,
        'transforms.rotation.axis.z'   : vertex.transforms.rotation.axis.z,
        'transforms.rotation.angle'    : vertex.transforms.rotation.angle,

        'transforms.translation.x' : vertex.transforms.translation.x,
        'transforms.translation.y' : vertex.transforms.translation.y,
        'transforms.translation.z' : vertex.transforms.translation.z,

        'transforms.scale.origin.x' : vertex.transforms.scale.origin.x,
        'transforms.scale.origin.y' : vertex.transforms.scale.origin.y,
        'transforms.scale.origin.z' : vertex.transforms.scale.origin.z,
        'transforms.scale.factor' : vertex.transforms.scale.factor,
      };
    };

    Workplane.prototype.getExpressions = function() {
      return _.extend(
        getCommonExpressions(this), {
          'parameters.gridsize' : this.parameters.gridsize,
        });
    };


    // ---------- Variable ----------


    var Variable = function(options) {
      if (!options.hasOwnProperty('name')) {
        throw new Error('No name');
      }
      options.type = 'variable';
      GeomNode.prototype.constructor.call(this, options);
      this.transforms = undefined;
      this.workplane = undefined;
    };

    _.extend(Variable.prototype, GeomNode.prototype);

    Variable.prototype.getExpressions = function() {
      return {
        'expression' : this.parameters.expression
      };
    };

    Variable.prototype.validateSchema = function() {
      if (!_.isString(this.name)) {
        return {'name' : 'not a string'};
      }
      if (this.name === '') {
        return {'name' : 'empty'};
      }
      return {};
    };


    // ---------- Point ----------

    var Point = function(options) {
      options = options || {};
      options.type = 'point';
      options.category = 'geometry';
      options.parameters = options.parameters || {coordinate: {x: '0', y:'0', z:'0'}};
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(Point.prototype, GeomNode.prototype);

    Point.prototype.getExpressions = function() {
      return _.extend({
        'x' : this.parameters.coordinate.x,
        'y' : this.parameters.coordinate.y,
        'z' : this.parameters.coordinate.z,
      }, getCommonExpressions(this));
    };

    Point.prototype.validateSchema = function() {
      if (this.parameters === undefined) {
        return {parameters: 'missing'};
      }
      if (this.parameters.coordinate === undefined) {
        return {'parameters.coordinate' : 'missing'};
      }
      return {};
    };

    // ---------- Polyline ----------

    var Polyline = function(options) {
      options = options || {};
      options.type = 'polyline';
      options.category = 'geometry';
      options.parameters = options.parameters || {};
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(Polyline.prototype, GeomNode.prototype);

    Polyline.prototype.getExpressions = function() {
      return getCommonExpressions(this);
    };

    // ----------- Cube ----------

    var Cube = function(options) {
      options = options || {};
      options.type = 'cube';
      options.category = 'geometry';
      options.parameters = options.parameters || {width:0, depth: 0, height: 0};
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(Cube.prototype, GeomNode.prototype);

    Cube.prototype.getExpressions = function() {
      return _.extend({
        'width'  : this.parameters.width,
        'depth'  : this.parameters.depth,
        'height' : this.parameters.height,
      }, getCommonExpressions(this));
    };

    Cube.prototype.validateSchema = function() {
      if (this.parameters === undefined) {
        return {parameters: 'missing'};
      }
      return {};
    };

    // ----------- Sphere ----------

    var Sphere = function(options) {
      options = options || {};
      options.type = 'sphere';
      options.category = 'geometry';
      options.parameters = options.parameters || {radius: 0};
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(Sphere.prototype, GeomNode.prototype);

    Sphere.prototype.getExpressions = function() {
      return _.extend({
        'radius' : this.parameters.radius,
      }, getCommonExpressions(this));
    };

    Sphere.prototype.validateSchema = function() {
      if (this.parameters === undefined) {
        return {parameters: 'missing'};
      }
      return {};
    };

    // ----------- Cylinder ----------

    var Cylinder = function(options) {
      options = options || {};
      options.type = 'cylinder';
      options.category = 'geometry';
      options.parameters = options.parameters || {
        radius: 0,
        height: 0,
      };
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(Cylinder.prototype, GeomNode.prototype);

    Cylinder.prototype.getExpressions = function() {
      return _.extend({
        'radius' : this.parameters.radius,
        'height' : this.parameters.height,
      }, getCommonExpressions(this));
    };

    Cylinder.prototype.validateSchema = function() {
      if (this.parameters === undefined) {
        return {parameters: 'missing'};
      }
      return {};
    };

  // ----------- Cone ----------

    var Cone = function(options) {
      options = options || {};
      options.type = 'cone';
      options.category = 'geometry';
      options.parameters = options.parameters || {
        radius: 0,
        height: 0,
      };
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(Cone.prototype, GeomNode.prototype);

    Cone.prototype.getExpressions = function() {
      return _.extend({
        'radius' : this.parameters.radius,
        'height' : this.parameters.height,
      }, getCommonExpressions(this));
    };

    Cone.prototype.validateSchema = function() {
      if (this.parameters === undefined) {
        return {parameters: 'missing'};
      }
      return {};
    };

    // ---------- Extrude ----------

    var Extrude = function(options) {
      options = options || {};
      options.type = 'extrude';
      options.category = 'geometry';
      options.parameters = options.parameters || {vector: {u: '0', v:'0', w:'1'}, height: '1'};
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(Extrude.prototype, GeomNode.prototype);

    Extrude.prototype.getExpressions = function() {
      return _.extend({
        'vector.u' : this.parameters.vector.u,
        'vector.v' : this.parameters.vector.v,
        'vector.w' : this.parameters.vector.w,
        'height' : this.parameters.height,
      }, getCommonExpressions(this));
    };

    Extrude.prototype.validateSchema = function() {
      if (this.parameters === undefined) {
        return {parameters: 'missing'};
      }
      if (this.parameters.vector === undefined) {
        return {'parameters.vector' : 'missing'};
      }
      if (this.parameters.height === undefined) {
        return {'parameters.height' : 'missing'};
      }
      return {};
    };

    // ---------- Booleans ----------

    var Subtract = function(options) {
      options = options || {};
      options.type = 'subtract';
      options.category = 'geometry';
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(Subtract.prototype, GeomNode.prototype);

    Subtract.prototype.getExpressions = function() {
      return getCommonExpressions(this);
    };

    var Intersect = function(options) {
      options = options || {};
      options.type = 'intersect';
      options.category = 'geometry';
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(Intersect.prototype, GeomNode.prototype);

    Intersect.prototype.getExpressions = function() {
      return getCommonExpressions(this);
    };

    var Union = function(options) {
      options = options || {};
      options.type = 'union';
      options.category = 'geometry';
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(Union.prototype, GeomNode.prototype);

    Union.prototype.getExpressions = function() {
      return getCommonExpressions(this);
    };

    // ---------- Imports ----------

    var STL = function(options) {
      options = options || {};
      options.type = 'stl';
      options.category = 'geometry';
      options.parameters = options.parameters;
      GeomNode.prototype.constructor.call(this, options);
    };

    _.extend(STL.prototype, GeomNode.prototype);

    STL.prototype.getExpressions = function() {
      return getCommonExpressions(this);
    };

    // ---------- Module ----------

    return {
      resetIDCounters: resetIDCounters,
      validateIdOrName: validateIdOrName,
      strip          : strip,
      Node           : GeomNode,
      Workplane      : Workplane,
      Variable       : Variable,
      Point          : Point,
      Polyline       : Polyline,
      Cube           : Cube,
      Sphere         : Sphere,
      Cylinder       : Cylinder,
      Cone           : Cone,
      Extrude        : Extrude,
      Union          : Union,
      Subtract       : Subtract,
      Intersect      : Intersect,
      STL            : STL,
      constructors: {
        'workplane': Workplane,
        'variable' : Variable,
        'point'    : Point,
        'polyline' : Polyline,
        'cube'     : Cube,
        'sphere'   : Sphere,
        'cylinder' : Cylinder,
        'cone'     : Cone,
        'extrude'  : Extrude,
        'union'    : Union,
        'subtract' : Subtract,
        'intersect': Intersect,
        'stl'      : STL,
      }
    };

  });
