define([
    'bcrypt'
  ],
  function(bcrypt) {

    var validateUsername = function(username) {
      return !!/^[a-zA-Z][a-zA-Z0-9._]*$/.exec(username);
    };

    var validateEmailAddress = function(emailAddress) {
      return !!/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}\b/.exec(emailAddress);
    };

    var validatePassword = function(password) {
      return !!/^.{6,}$/.exec(password);
    };

    var get = function(db, username, callback) {
      var key = keyFromUsername(username);
      db.get(key, callback);
    };

    var create = function(db, username, password, callback) {
      var key = keyFromUsername(username);

      var userData = {
        username: username,
        password_bcrypt: bcrypt.hashSync(password, 12),
      };
      db.set(key, userData, function(err) {
        if (err) {
          callback(err);
        } else {
          callback();
        }
      });

    };

    var checkPassword = function(db, username, password, callback) {
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

    var keyFromUsername = function(username) {
      return '_user/' + username;
    };

    return {
      validateUsername    : validateUsername,
      validateEmailAddress: validateEmailAddress,
      validatePassword    : validatePassword,
      get                 : get,
      create              : create,
      checkPassword       : checkPassword,
    };

  });