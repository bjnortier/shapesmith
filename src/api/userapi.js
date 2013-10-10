var _ = require('underscore');
var bcrypt = require('bcrypt');
var uuid = require('node-uuid');
var users = require('./users');
var userDB = require('./userdb');

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
      errors: errors
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

    if (_.keys(errors).length) {
      res.render('signup', view);
      return;
    }

    userDB.init(username, function(err, db) {
      if (err) {
        return res.render(500, 'signup');
      }

      users.get(db, username, function(err, existingUserData) {
        if (err) {
          res.render(500, 'signup');
        } else if (existingUserData !== null) {
          view.errors.username = 'sorry, this username is taken';
          res.render('signup', view);
        } else {
          var userData = {
            username: username, 
            password_bcrypt: bcrypt.hashSync(password, 12),
          };
          users.create(db, userData, function(err) {
            if (err) {
              res.render(500, 'signup');
            } else {
              req.session.username = username;
              res.redirect('/ui/' + username + '/designs');
            }
          });
        }
      });

    });

  });

  // Create a new temporary user
  app.post(/^\/createtemp\/?$/, function(req, res) {

    var username = uuid.v4();
    var userData = {
      username: username,
      temporary: true, 
    };

    userDB.init(username, function(err, db) {
      if (err) {
        return res.render(500, 'signup');
      }
      
      users.create(db, userData, function(err) {
        if (err) {
          res.render(500, 'signup');
        } else {
          req.session.username = username;
          req.session.temporary = true;
          res.redirect('/ui/' + username + '/designs');
        }
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
        return res.render(500, 'signin');
      }
      
      users.checkPassword(db, username, password, function(err, paswordMatches) {
        if (err) {
          res.render('signin');
        } else {
          if (paswordMatches) {
            req.session.username = username;
            res.redirect('/ui/' + username + '/designs');
          } else {
            res.render('signin', {
              errors: {
                username: 'username and password don\'t match',
                password: 'username and password don\'t match',
              }
            });
          }
        }
      });
    });
  });

};

module.exports = UserAPI;

