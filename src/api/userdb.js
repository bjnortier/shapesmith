var fs = require('fs');
var nconf = require('nconf');
var ueberDB = require('ueberDB');

var dbType = nconf.get('dbType') || 'sqlite';


function sqliteFileFromUsername(username) {
  return 'db/' + username + '.db';
}

function coucbDBFilenameFromUsername(username) {
  return nconf.get('couchVarLib') + username + '.couch';
}

module.exports.init = function(username, callback) {

  var db;
  if (dbType === 'sqlite') {
    db = new ueberDB.database(dbType, {
      filename: sqliteFileFromUsername(username),
    });
  } else {
    db = new ueberDB.database(dbType, {
      database: username,
    });
  }

  db.init(function(err) {
    callback(err, db);
  });

};

module.exports.create = function(db, callback) {
  if (dbType === 'couch') {
    db.db.wrappedDB.db.create(callback);
  } else {
    callback();
  }
};

module.exports.rename = function(previoususername, newusername) {
  if (dbType === 'sqlite') {
    fs.renameSync(
      sqliteFileFromUsername(previoususername),
      sqliteFileFromUsername(newusername));
  } else if (dbType === 'couch') {
    fs.renameSync(
      coucbDBFilenameFromUsername(previoususername),
      coucbDBFilenameFromUsername(newusername));
  } else {
    throw new Error('not supported');
  }
};

module.exports.userExists = function(username) {
  if (dbType === 'sqlite') {
    return fs.existsSync(sqliteFileFromUsername(username));
  } else if (dbType === 'couch') {
    return fs.existsSync(coucbDBFilenameFromUsername(username));
  } else {
    throw new Error('not supported');
  }
};

