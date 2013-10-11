var fs = require('fs');
var nconf = require('nconf');
var ueberDB = require('ueberDB');

function sqliteFileFromUsername(username) {
  return 'db/' + username + '.db';
}

module.exports.init = function(username, callback) {
  var dbType = nconf.get('dbType') || 'sqlite';

  var db = new ueberDB.database(dbType, {filename: sqliteFileFromUsername(username)});

  db.init(function(err) {
    callback(err, db);
  });

};

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function() {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

module.exports.copy = function(previoususername, newusername, callback) {
  copyFile(
    sqliteFileFromUsername(previoususername),
    sqliteFileFromUsername(newusername), callback);
};

module.exports.userExists = function(username) {
  return fs.existsSync(sqliteFileFromUsername(username));
};

