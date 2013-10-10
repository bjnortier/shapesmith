var express = require('express');
var path = require('path');
var nconf = require('nconf');
var app = express();
var ueberDB = require("ueberDB");

var requirejs = require('requirejs');
var rootDir = path.normalize(path.join(__dirname, '../..'));
var baseUrl = path.join(__dirname, "..");
requirejs.config({
  baseUrl: baseUrl,
  nodeRequire: require,
});

// ---------- Configuration ----------

// Override with command-line arguments
nconf.argv();
nconf.env();

var NODE_ENV = nconf.get('NODE_ENV') || 'development';
nconf.file({file: path.join(rootDir, path.join('config', NODE_ENV + '.json'))});

var dbType = nconf.get('dbType') || 'sqlite';
var dbArgs = nconf.get('dbArgs') || {};
var authEngine = nconf.get('authEngine') || 'local';

console.info("");
console.info("    .                           .  .   ");
console.info(",-. |-. ,-. ,-. ,-. ,-. ,-,-. . |- |-. ");
console.info("`-. | | ,-| | | |-' `-. | | | | |  | | ");
console.info("`-' ' ' `-^ |-' `-' `-' ' ' ' ' `' ' ' ");
console.info("            '                          ");

console.info('\n\nconfiguration:');
console.info('--------------');
console.info('environment: ', NODE_ENV);
console.info('port:        ', nconf.get('port'));
console.info('baseUrl:     ', baseUrl);
console.info('dbtype:      ', dbType);
console.info('dbargs:      ', dbArgs);

// ---------- Create db ----------

app.set('view engine', 'hbs');
app.set('views', path.join(rootDir, 'templates'));

app.use('/images', express.static(path.join(rootDir, 'static', 'images')));
app.use('/css', express.static(path.join(rootDir, 'static', 'css')));
app.use('/src/', express.static(path.join(rootDir, 'src')));
app.use('/src/node_modules', express.static(path.join(rootDir, 'node_modules')));
app.use('/node_modules', express.static(path.join(rootDir, 'node_modules')));
app.use('/lib', express.static(path.join(rootDir, 'src/lib')));

app.use(express.cookieParser());
app.use(express.session({secret: '1234567890QWERTY'}));
app.use(express.bodyParser());

// app.use(express.logger());


var SessionAuth = function() {

  this.canRead = function(username, req) {
    return (req.session.username === username);
  };

  this.canWrite = function(username, req) {
    return (req.session.username === username);
  };

  this.renderLanding = function(req, res) {
    if (req.session.username) {
      res.redirect('/ui/' + req.session.username + '/designs');
    } else {
      res.render('landing');
    }
  };
  this.unauthorizedRedirect = function(res) {
    res.redirect('/');
  };
};

var LocalAuth = function() {

  this.canRead = function(username) {
    return username === 'local';
  };
  this.canWrite = function(username) {
    return username === 'local';
  };
  this.renderLanding = function(req, res) {
    res.redirect('/ui/local/designs');
  };
  this.unauthorizedRedirect = function(res) {
    res.redirect('/ui/local/designs');
  };
};

var authProvider;
if (authEngine === 'session') {
  authProvider = new SessionAuth();
} else {
  authProvider = new LocalAuth();
}
app.set('authEngine', authProvider);

var db = new ueberDB.database(dbType, dbArgs);
db.init(function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  new requirejs('api/userapi')(app, db);
  new requirejs('api/designapi')(app, db);
  new requirejs('api/objectapi')(app, db);
});

// Authentication for /ui
app.use('/ui', function(req, res, next) {
  var match = /\/([\w._-]+)\//.exec(req.path);
  if (match) {
    // Ensure the username matches the session username
    var username = match[1];
    if (authProvider.canRead(username, req)) {
      next();
    } else {
      authProvider.unauthorizedRedirect(res);
    }
  } else {
    authProvider.unauthorizedRedirect(res);
  }
});

// Authentication for /api
app.use('/api', function(req, res, next) {
  var match = /\/([\w._-]+)\//.exec(req.path);
  if (match) {
    // Ensure the username matches the session username
    var username = match[1];
    if (authProvider.canRead(username, req)) {
      next();
    } else {
      res.json(401, 'unauthorized');
    }
  } else {
    res.json(401, 'unauthorized');
  }
});

// Index
app.get('/', function(req, res) {
  authProvider.renderLanding(req, res);
});

// Signin
app.get(/^\/signin\/?$/, function(req, res) {
  res.render('signin');
});

// Signup
app.get(/^\/signup\/?$/, function(req, res) {
  res.render('signup', {temporary: req.session.temporary});
});

// Signout
app.get(/^\/signout\/?$/, function(req, res) {
  req.session.username = undefined;
  res.redirect('/');
});

// Designs 
app.get(/^\/ui\/([\w._-]+)\/designs\/?$/, function(req, res) {
  var username = decodeURIComponent(req.params[0]);
  res.render('designs', {
    user: username, 
    temporary: req.session.temporary,
    signoutButton: ((authEngine === 'session') && !req.session.temporary),
  });
});

// Modeller 
app.get(/^\/ui\/([\w._-]+)\/([\w%]+)\/modeller$/, function(req, res) {
  var username = decodeURIComponent(req.params[0]);
  var design = decodeURIComponent(req.params[1]);
  res.render('modeller', {user: username, design: design});
});

// For controlling the process (e.g. via Erlang) - stop the server
// when stdin is closed
process.stdin.resume();
process.stdin.on('end', function() {
  process.exit();
});

module.exports = app;