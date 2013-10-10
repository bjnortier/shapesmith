var bcrypt = require('bcrypt');


module.exports.validateUsername = function(username) {
  return !!/^[a-zA-Z][a-zA-Z0-9._-]*$/.exec(username);
};

module.exports.validateEmailAddress = function(emailAddress) {
  return !!/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}\b/.exec(emailAddress);
};

module.exports.validatePassword = function(password) {
  return !!/^.{6,}$/.exec(password);
};

var keyFromUsername = function(username) {
  return '_user/' + username;
};

module.exports.get = function(db, username, callback) {
  var key = keyFromUsername(username);
  db.get(key, callback);
};

module.exports.create = function(db, userData, callback) {
  var key = keyFromUsername(userData.username);
  db.set(key, userData, function(err) {
    if (err) {
      callback(err);
    } else {
      callback();
    }
  });

};

module.exports.checkPassword = function(db, username, password, callback) {
  var key = keyFromUsername(username);
  db.get(key, function(err, userData) {
    if (err) {
      callback(err);
    } else if (userData === null) {
      callback(undefined, false);
    } else {
      var hash = userData.password_bcrypt;
      bcrypt.compare(password, hash, callback);
    }
  });
};

module.exports.keyFromUsername = keyFromUsername;
