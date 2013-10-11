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

module.exports.rename = function(previoususername, newusername) {
  fs.renameSync(
    sqliteFileFromUsername(previoususername),
    sqliteFileFromUsername(newusername));
};

module.exports.userExists = function(username) {
  return fs.existsSync(sqliteFileFromUsername(username));
};

