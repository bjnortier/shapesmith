var _ = require('underscore');
var bcrypt = require('bcrypt');
var uuid = require('node-uuid');
var users = require('./users');
var designs = require('./designs');
var userDB = require('./userdb');
var nconf = require('nconf');
var config = nconf.get();

var UserAPI = function(app) {

  // Create a new user
  app.post(/^\/signup\/?$/, function(req, res) {
    var username = req.body.username;
    var emailAddress = req.body.emailAddress;
    var password = req.body.password;

    var errors = {};
    var view = {
      username: username,
      emailAddress: emailAddress,
      password: password,
      errors: errors,
      track: config.track,
    };

    if (username === undefined) {
      errors.username = 'please provide a valid username (only letters and numbers)';
    }
    if (emailAddress === undefined) {
      errors.emailAddress = 'please provide a valid email address';
    }
    if (password === undefined) {
      errors.password = 'please provide a password with a minimum of 6 characters';
    }

    if (!users.validateUsername(username)) {
      errors.username = 'please provide a valid username (only letters and numbers)';
    }
    if (!users.validateEmailAddress(emailAddress)) {
      errors.emailAddress = 'please provide a valid email address';
    }

    if (!users.validatePassword(password)) {
      errors.password = 'please provide a password with a minimum of 6 characters';
    }

    if (userDB.userExists(username)) {
      errors.username = 'sorry, this username is taken';
    }

    if (_.keys(errors).length) {
      res.render('signup', view);
      return;
    }

    // Rename the db to the new user
    if (req.session.temporary) {
      userDB.rename(req.session.username, username);
    }

    userDB.init(username, function(err, db) {
      if (err) {
        console.error(err);
        return res.render('signup', {
          track: config.track
        });
      }

      function createIfNotTemporary(callback) {
        if (!req.session.temporary) {
          userDB.create(db, callback);
        } else {
          callback(null);
        }
      }

      createIfNotTemporary(function(err) {
        if (err) {
          console.error(err);
          return res.render('signup', {
            track: config.track
          });
        }

        var userData = {
          username: username, 
          password_bcrypt: bcrypt.hashSync(password, 12),
          createdAt: new Date().toISOString(),
        };

        if (req.session.temporary) {
          userData.upgradedFrom = req.session.username;
          userData.upgratedAt = new Date().toISOString();
          req.session.temporary = undefined;
        }

        users.create(db, userData, function(err) {
          if (err) {
            console.error(err);
            res.render('signup', {
              track: config.track
            });
          } else {
            req.session.username = username;
            res.redirect('/ui/' + username + '/designs');
          }
        });

      });
    });

  });

  // Create a new temporary user
  app.post(/^\/createtemp\/?$/, function(req, res) {

    var username = 'tmp_' + uuid.v4();
    var userData = {
      username: username,
      temporary: true, 
    };

    userDB.init(username, function(err, db) {
      if (err) {
        console.error(err);
        return res.render('signup', {
          track: config.track
        });
      }

      userDB.create(db, function(err) {
        if (err) {
          console.error(err);
          return res.render('signup', {
            track: config.track
          });
        }
      
        users.create(db, userData, function(err) {
          if (err) {
            console.error(err);
            res.render('signup', {
              track: config.track
            });
          } else {
            req.session.username = username;
            req.session.temporary = true;

            designs.create(db, username, 'first model', function(err, refs) {
              if (err) {
                console.error(err);
                res.render('signup', {
                  track: config.track
                });
              } else {
                res.redirect('/ui/' + username + '/first%20model/modeller?commit=' + refs.heads.master);
              }
            });
          }
        });
      });
    });

  });

  // app.get(/^\/user\/([\w%@.]+)\/?$/, function(req, res) {
    
  //   var username = decodeURIComponent(req.params[0]);
  //   if (!app.get('authEngine').canRead(username, req)) {
  //     res.json(401, 'Unauthorized');
  //     return;
  //   }

  //   users.get(db, username, function(err, userData) {
  //     if (err) {
  //       res.json(500, err);
  //     } else if (userData === null) {
  //       res.json(404, 'not found');
  //     } else {
  //       res.json(userData);
  //     }
  //   });

  // });

  // app.delete(/^\/session\/?$/, function(req, res) {
  //   req.session.destroy(function() {
  //     res.json(200, 'signed out');
  //   });
  // });

  app.post(/^\/signin\/?$/, function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    userDB.init(username, function(err, db) {
      if (err) {
        console.error(err);
        return res.render('signin', {
          track: config.track
        });
      }
      
      users.checkPassword(db, username, password, function(err, paswordMatches) {
        if (err) {
          console.error(err);
          res.render('signin', {
            track: config.track
          });
        } else {
          if (paswordMatches) {
            req.session.username = username;
            res.redirect('/ui/' + username + '/designs');
          } else {
            res.render('signin', {
              errors: {
                username: 'username and password don\'t match',
                password: 'username and password don\'t match',
              },
              username: username,
              track: config.track,
            });
          }
        }
      });
    });
  });

};

module.exports = UserAPI;

