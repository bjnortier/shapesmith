var objects = require('./objects');


var createDesignKey = function(username, design) {
  return 'design/' + design;
};

var allDesignsKeys = 'designs';

var updateAllList = function(db, username, updateFn, callback) {
  db.get(allDesignsKeys, function(err, list) {
    if (err) {
      callback(err);
    } else {
      var newList = updateFn(list || []);
      db.set(allDesignsKeys, newList, callback);
    }
  });
};

module.exports.validate = function(name) {
  return !!/^[a-zA-Z_][a-zA-Z0-9-_\s]*$/.exec(name);
};

module.exports.getAll = function(db, username, callback) {
  db.get(allDesignsKeys, callback);
};

module.exports.get = function(db, username, design, callback) {
  var key = createDesignKey(username, design);
  db.get(key, callback);
};

module.exports.del = function(db, username, design, callback) {

  var key = createDesignKey(username, design);
  db.get(key, function(err, value) {
    if (err) {
      callback(err);
    } else if (value === null) {
      callback('notFound');
    } else {
      db.remove(key, function() {

        // Update all list
        updateAllList(db, username, function(list) {
          var index = list.indexOf(design);
          if (index === -1) {
            callback('notFound');
          } else {
            list.splice(index, 1);
            return list;
          }
        }, callback);

      });
    }

  });

};

module.exports.create = function(db, username, design, callback) {

  var designKey = createDesignKey(username, design);

  objects.createNewGraph(db, username, function(err, sha) {
    if (err) {
      callback(err);
      return;
    }
    var refs = {
      'heads' : {
        'master': sha
      }
    };
    db.set(designKey, refs, function() {

      updateAllList(db, username, function(list) {
        return list.concat(design);
      }, function(err) {
        if (err) {
          callback(err);
        } else {
          callback(undefined, refs);
        }
      });

    });
  });

};

module.exports.updateRef = function(db, username, design, type, ref, newSHA, callback) {

  var key = createDesignKey(username, design);
  db.get(key, function(err, refs) {
    if (err) {
      callback(err);
      return;
    }
    if (refs === null) {
      callback('notFound');
      return;
    }
    if (refs.hasOwnProperty(type) && (refs[type].hasOwnProperty(ref))) {
      refs[type][ref] = newSHA;
      db.set(key, refs, function(err) {
        if (err) {
          callback(err);
        } else {
          callback();
        }
      });
    } else {
      callback('notFound');
    }
  });
};

module.exports.rename = function(db, username, from, to, callback) {

  var fromKey = createDesignKey(username, from);
  var toKey = createDesignKey(username, to);
  db.get(fromKey, function(err, refs) {
    if (err) {
      callback(err);
      return;
    }
    if (refs === null) {
      callback('notFound');
      return;
    }
    db.get(toKey, function(err, conflictRefs) {
      if (err) {
        callback(err);
        return;
      }
      if (conflictRefs !== null) {
        callback('alreadyExists');
        return;
      }

      // Set the new key & remove old one
      db.set(toKey, refs, function(err) {
        if (err) {
          callback(err);
        } else {
          db.remove(fromKey, function() {

            // Update all list
            updateAllList(db, username, function(list) {
              var index = list.indexOf(from);
              if (index === -1) {
                callback('notFound');
              } else {
                list.splice(index, 1, to);
                return list;
              }
            }, callback);

          });
        }
      });
    });
  });

};

