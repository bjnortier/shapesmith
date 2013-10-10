var nconf = require('nconf');
var ueberDB = require('ueberDB');

module.exports.init = function(username, callback) {
  var dbType = nconf.get('dbType') || 'sqlite';

  var db = new ueberDB.database(dbType, {filename: 'db/' + username + '.db'});
  db.init(function(err) {
    callback(err, db);
  });

};