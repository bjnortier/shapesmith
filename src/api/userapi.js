define(
  [
    'underscore',
    './users'
  ], 
  function(_, users) {

    var UserAPI = function(app, db) {

      // Create a new user
      app.post(/^\/user\/?$/, function(req, res) {
        var username = req.body.username;
        var password = req.body.password;

        var errors = [];
        var addError = function(key, value) {
          var hasKey = !!_.find(errors, function(e) {
            return e.hasOwnProperty(key);
          });
          if (!hasKey) {
            var error = {};
            error[key] = value;
            errors.push(error);
          }
        };

        if (username === undefined) {
          addError('username', 'please provide a valid email address');
        }
        if (password === undefined) {
          addError('password', 'please provide a password with a minimum of 6 characters');
        }

        if (!users.validateUsername(username)) {
          addError('username', 'please provide a valid email address');
        }

        if (!users.validatePassword(password)) {
          addError('password', 'please provide a password with a minimum of 6 characters');
        }

        if (errors.length) {
          res.json(400, {errors: errors});
          return;
        }

        users.get(db, username, function(err, userData) {
          if (err) {
            res.json(500, err);
          } else if (userData !== null) {
            res.json(409, {errors: [{username: 'sorry, this email address is already used'}]});
          } else {
            users.create(db, username, password, function(err) {
              if (err) {
                res.send(500, err);
              } else {
                req.session.username = username;
                res.json(201, 'created');
              }
            });
          }
        });

      });

      app.get(/^\/user\/([\w%@.]+)\/?$/, function(req, res) {
        
        var username = decodeURIComponent(req.params[0]);
        if (!app.get('authEngine').canRead(username, req)) {
          res.json(401, 'Unauthorized');
          return;
        }

        users.get(db, username, function(err, userData) {
          if (err) {
            res.json(500, err);
          } else if (userData === null) {
            res.json(404, 'not found');
          } else {
            res.json(userData);
          }
        });

      });

      app.delete(/^\/session\/?$/, function(req, res) {
        req.session.destroy(function() {
          res.json(200, 'signed out');
        });
      });

      app.post(/^\/session\/?$/, function(req, res) {
        var username = req.body.username;
        var password = req.body.password;
        users.checkPassword(db, username, password, function(err, paswordMatches) {
          if (err) {
            res.json(500, err);
          } else {
            if (paswordMatches) {
              req.session.username = username;
              res.json('ok');
            } else {
              res.json(401, 'Unauthorized');
            }
          }
        });
      });

    };

    return UserAPI;

  });