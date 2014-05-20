define([
    'underscore',
    'backbone-events',
    'casgraph/sha1hasher',
    'geomnode',
    'geometrygraphsingleton',
    './normalize',
    './pool',
    './bspdb',
    'csg',
    'toolbars/parsestl',
    'progresstrackable',
  ], function(
    _,
    Events,
    SHA1Hasher,
    GeomNode,
    geometryGraph,
    Normalize,
    pool,
    BSPDB,
    CSG,
    parseSTL,
    progressTrackable) {

    var infoHandler = function() {
      console.info.apply(console, arguments);
    };

    var errorHandler = function() {
      console.error.apply(console, arguments);
    };

    var bspdb = new BSPDB(infoHandler, errorHandler);

    var getOrGenerate = function(sha, generator, callback) {
      // Read from the DB, or generate it if it doesn't exist
      bspdb.read(sha, function(err, jobResult) {
        if (err) {
          console.error('error reading from BSP DB', err);
        }
        if (jobResult) {
          callback(undefined, jobResult);
        } else {
          var jobId = generator();
          pool.broker.on('jobDone', function(jobResult) {

            if (jobResult.id === jobId) {
              bspdb.write({
                sha: sha,
                csg: jobResult.csg,
              }, function(err) {
                if (err) {
                  postMessage({error: 'error writing to BSP DB' + err});
                }
              });

              jobResult.sha = sha;
              callback(undefined, jobResult);
            }
          });
        }
      });
    };

    var generateBoolean = function(vertex, csgGenerator, callback) {

      var children = geometryGraph.childrenOf(vertex);
      var childResults = {};
      var allChildrenExist;

      // Ensure all children exist
      var remaining = children.length;
      children.forEach(function(child) {
        generate(child, function(err, result) {
          if (err) {
            callback(err);
          } else {
            --remaining;
            childResults[child.id] = result;
            if (remaining === 0) {
              allChildrenExist();
            }
          }
        });
      });

      allChildrenExist = function() {
        var uniqueObj = GeomNode.strip(vertex);
        var childSHAs = children.map(function(child) {
          return childResults[child.id].sha;
        });
        uniqueObj.childSHAs = childSHAs;
        var sha = SHA1Hasher.hash(uniqueObj);

        var childBSPs = children.map(function(child) {
          return childResults[child.id].csg;
        });

        if (addCallbackAndShouldGenerate(sha, callback)) {
          getOrGenerate(sha, function() {
            var normalized = Normalize.normalizeVertex(vertex);
            return csgGenerator(sha, childBSPs, normalized.transforms, normalized.workplane);
          }, performCallback);
        }
      };

    };

    // Share the generate callbacks so only a single generate is performed
    // for multiple renders for example

    var generateCallbacks = {};

    var addCallbackAndShouldGenerate = function(sha, callback) {
      if (!generateCallbacks[sha]) {
        generateCallbacks[sha] = [];
      }
      generateCallbacks[sha].push(callback);
      return generateCallbacks[sha].length === 1;
    };

    var performCallback = function(err, result) {
      generateCallbacks[result.sha].forEach(function(callback) {
        callback(err, result);
      });
      delete generateCallbacks[result.sha];
    };

    var generate = function(vertex, callback) {
      var normalized, sha;
      switch (vertex.type) {
      case 'sphere':
        normalized = Normalize.normalizeVertex(vertex);
        sha = SHA1Hasher.hash(normalized);
        if (addCallbackAndShouldGenerate(sha, callback)) {
          getOrGenerate(sha, function() {
            return pool.createSphere(sha, normalized, normalized.transforms, normalized.workplane);
          }, performCallback);
        }
        break;
      case 'cylinder':
        normalized = Normalize.normalizeVertex(vertex);
        sha = SHA1Hasher.hash(normalized);
        if (addCallbackAndShouldGenerate(sha, callback)) {
          getOrGenerate(sha, function() {
            return pool.createCylinder(sha, normalized, normalized.transforms, normalized.workplane);
          }, performCallback);
        }
        break;
      case 'cone':
        normalized = Normalize.normalizeVertex(vertex);
        sha = SHA1Hasher.hash(normalized);
        if (addCallbackAndShouldGenerate(sha, callback)) {
          getOrGenerate(sha, function() {
            return pool.createCone(sha, normalized, normalized.transforms, normalized.workplane);
          }, performCallback);
        }
        break;
      case 'cube':
        normalized = Normalize.normalizeVertex(vertex);
        sha = SHA1Hasher.hash(normalized);
        if (addCallbackAndShouldGenerate(sha, callback)) {
          getOrGenerate(sha, function() {
            return pool.createCube(sha, normalized, normalized.transforms, normalized.workplane);
          }, performCallback);
        }
        break;
      case 'union':
        generateBoolean(vertex, pool.createUnion, callback);
        break;
      case 'subtract':
        generateBoolean(vertex, pool.createSubtract, callback);
        break;
      case 'intersect':
        generateBoolean(vertex, pool.createIntersect, callback);
        break;
      case 'stl':
        normalized = Normalize.normalizeVertex(vertex);
        sha = SHA1Hasher.hash(normalized);
        if (addCallbackAndShouldGenerate(sha, callback)) {
          getOrGenerate(sha, function() {
            var csg = parseSTL(normalized.stl);
            return pool.createMesh(sha, csg, normalized.transforms, normalized.workplane);
          }, performCallback);
        }
        break;
      default:
        throw new Error('unknown vertex id/type: ' + vertex.id + '/' + vertex.type);
      }
    };

    var Broker = function() {
      _.extend(this, Events);
    };
    var broker = new Broker();
    this.broker = broker;

    var uiDBInitialized = false, poolInitialized = false;
    bspdb.on('initialized', function() {
      uiDBInitialized = true;
      if (uiDBInitialized && poolInitialized) {
        broker.trigger('initialized');
      }
    });

    pool.broker.on('initialized', function() {
      poolInitialized = true;
      if (uiDBInitialized && poolInitialized) {
        broker.trigger('initialized');
      }
    });

    var trackers = [];
    pool.broker.on('jobQueued', function(id) {
      trackers[id] = progressTrackable.create(broker);
    });
    pool.broker.on('jobDone', function(result) {
      trackers[result.id].finish();
      delete trackers[result.id];
    });

    return {
      generate: generate,
      broker  :  broker,
    };

  });
