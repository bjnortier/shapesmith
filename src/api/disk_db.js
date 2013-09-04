define([
    'fs', 
    'path', 
    'util',
    'graphapi',
  ], function(
    fs, 
    path, 
    util,
    graphAPI) {

  var DiskDB = function(config) {

    if (!config.root) {
      throw Error('no root directory for disk db');
    }
    var root = path.normalize(config.root);
    // Use sync function here as this is on app startup and we want to fail
    // immediately
    if (!fs.existsSync(root)) {
      throw Error(util.format('directory "%s" doesn\'t exist', root));
    }
    if (!fs.statSync(root).isDirectory()) {
      throw Error(util.format('directory "%s" is not a directory', root));   
    }

    this.createDesignPath = function(user, design, callback) {
      var designPath = path.join(root, user, design);
      fs.exists(designPath, function(exists) {
        if (exists) {
          callback('already_exists');
        } else {
          // Create the design directory with the graph and vertex buckets
          fs.mkdir(designPath, function(err) {
            if (err) {
              callback(err);
            } else {

              fs.mkdir(path.join(designPath, 'graph'), function(err) {
                if (err) {
                  callback(err);
                } else {

                  fs.mkdir(path.join(designPath, 'vertex'), function(err) {
                    if (err) {
                      callback(err);
                    } else {
                      callback();
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    this.createGraph = function(user, design, graph, callback) {
      var sha = graphAPI.hashObject(graph);
      var graphPath = path.join(root, user, design, 'graph', sha);
      fs.writeFile(graphPath, JSON.stringify(graph), function (err) {
        if (err) {
          callback(err);
        } else {
          callback(undefined, sha);
        }
      });
    }

    this.getGraph = function(user, design, sha, callback) {
      var graphPath = path.join(root, user, design, 'graph', sha);
      fs.readFile(graphPath, function (err, data) {
        if (err) {
          callback(err);
        } else {
          callback(undefined, JSON.parse(data));
        }
      });
    }


    this.createVertex = function(user, design, vertex, callback) {
      var sha = graphAPI.hashObject(vertex);
      var graphPath = path.join(root, user, design, 'vertex', sha);
      fs.writeFile(graphPath, JSON.stringify(vertex), function (err) {
        if (err) {
          callback(err);
        } else {
          callback(undefined, sha);
        }
      });
    }

    this.getVertex = function(user, design, sha, callback) {
      var vertexPath = path.join(root, user, design, 'vertex', sha);
      fs.readFile(vertexPath, function (err, data) {
        if (err) {
          if (err.code === 'ENOENT') {
            callback('notFound');
          } else {
            callback(err);
          }
        } else {
          callback(undefined, JSON.parse(data));
        }
      });
    }

    this.addDesign = function(user, design, callback) {

      var designsPath = path.join(root, user, '_designs');
      fs.readFile(designsPath, function (err, data) {
        if (err) {
          if (err.code === 'ENOENT') {
            // Create hte designs file
            fs.writeFile(designsPath, JSON.stringify([design]), function(err) {
              callback(err);
            });
          } else {
            callback(err);
          }
        } else {
          // Add the new design
          var designs = JSON.parse(data).concat([design]);
          fs.writeFile(designsPath, JSON.stringify(designs), function(err) {
            callback(err);
          });
        }
      });

    }

    this.getDesigns = function(user, callback) {

      var designsPath = path.join(root, user, '_designs');
      fs.readFile(designsPath, function (err, data) {
        if (err) {
          if (err.code === 'ENOENT') {
            callback(undefined, []);
          } else {
            callback(err);
          }
        } else {
          callback(undefined, JSON.parse(data));
        }
      });
    }

    this.renameDesign = function(user, design, newName, callback) {

      var designsPath = path.join(root, user, '_designs');
      fs.readFile(designsPath, function (err, data) {
        if (err) {
          callback(err);
        } else {
          var designs = JSON.parse(data);
          var oldDirectoryPath = path.join(root, user, design);
          var newDirectoryPath = path.join(root, user, newName);

          fs.exists(newDirectoryPath, function(exists) {
            if (exists || (designs.indexOf(newName) !== -1)) {
              callback('alreadyExists')
            } else {
              
              fs.rename(oldDirectoryPath, newDirectoryPath, function(err) {
              if (err) {
                callback(err);
              } else {
                designs.splice(designs.indexOf(design), 1, newName);
                fs.writeFile(designsPath, JSON.stringify(designs), function(err) {
                  if (err) {
                    callback(err);
                  } else {
                    callback(undefined, 'ok');
                  }
                });
              }
            });

            }
          });

        }
      });

    }

    // 
    this.deleteDesign = function(user, design, callback) {
      var designsPath = path.join(root, user, '_designs');
      fs.readFile(designsPath, function (err, data) {
        if (err) {
          callback(err);
        } else {
          // Add the new design
          var designs = JSON.parse(data);
          var index = designs.indexOf(design);
          if (index === -1) {
            callback('notFound');
          } else {
            designs.splice(index, 1);
            fs.writeFile(designsPath, JSON.stringify(designs), function(err) {

              var directoryPath = path.join(root, user, design);
              var deletedDirectoryPath = directoryPath + '.deleted.' + new Date().getTime();
                fs.rename(directoryPath, deletedDirectoryPath, function(err) {
                  callback(err, 'ok');
                });

            });
          }
        }
      });
    }

    this.getRefs = function(user, design, callback) {
      var refsPath = path.join(root, user, design, '_refs');
      fs.readFile(refsPath, function (err, data) {
        callback(err, data && JSON.parse(data));
      });
    }

    this.createRefs = function(user, design, refs, callback) {
      var refsPath = path.join(root, user, design, '_refs');
      fs.writeFile(refsPath, JSON.stringify(refs), function (err) {
        callback(err);
      });
    }

    this.updateRefs = function(user, design, type, ref, refData, callback) {
      var refsPath = path.join(root, user, design, '_refs');
      var refs = fs.readFile(refsPath, function (err, currentRefs) {
        if (err) {
          callback(err);
        } else {
          var refsJson = JSON.parse(currentRefs);
          refsJson[type][ref] = refData;
          fs.writeFile(refsPath, JSON.stringify(refsJson), function (err) {
            callback(err, 'ok')
          });
        }
      });
    }

  }

  return DiskDB;

});