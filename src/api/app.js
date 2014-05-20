var express = require('express');
var path = require('path');
var nconf = require('nconf');
var app = express();

var rootDir = path.normalize(path.join(__dirname, '../..'));

// ---------- Configuration ----------

// Override with command-line arguments
nconf.argv();
nconf.env();

var NODE_ENV = nconf.get('NODE_ENV') || 'development';
nconf.file({file: path.join(rootDir, path.join('config', NODE_ENV + '.json'))});

var config = nconf.get();
var dbType = config.dbType || 'sqlite';
var authEngine = config.authEngine || 'local';

console.info("");
console.info("    .                           .  .   ");
console.info(",-. |-. ,-. ,-. ,-. ,-. ,-,-. . |- |-. ");
console.info("`-. | | ,-| | | |-' `-. | | | | |  | | ");
console.info("`-' ' ' `-^ |-' `-' `-' ' ' ' ' `' ' ' ");
console.info("            '                          ");

console.info('\nconfiguration:');
console.info('---------------------------------------');
console.info('environment:       ', NODE_ENV);
console.info('port:              ', config.port);
console.info('dbtype:            ', dbType);
console.info('redisSessionStore: ', !!config.redisSessionStore);
console.info('---------------------------------------');

// ---------- Create db ----------

app.set('view engine', 'hbs');
app.set('views', path.join(rootDir, 'templates'));

app.use('/images', express.static(path.join(rootDir, 'static', 'images')));
app.use('/css', express.static(path.join(rootDir, 'static', 'css')));
app.use('/src/', express.static(path.join(rootDir, 'src')));
app.use('/src/node_modules', express.static(path.join(rootDir, 'node_modules')));
app.use('/node_modules', express.static(path.join(rootDir, 'node_modules')));
app.use('/lib', express.static(path.join(rootDir, 'src/lib')));

app.use(express.bodyParser({limit: '50mb'}));
app.use(express.cookieParser());

if (config.redisSessionStore) {
  var RedisStore = require('connect-redis')(express);
  app.use(express.session({
    store: new RedisStore({
      host: 'localhost',
      port: 6379,
    }),
    secret: 'cd68c833de39de4bbb924acd54d9c635'
  }));
} else {
  app.use(express.session({secret: '00564f4637dcb818688842dac6442fe0'}));
}

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
      res.render('landing', {
        track: config.track
      });
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

new require('./userapi')(app);
new require('./designapi')(app);
new require('./objectapi')(app);

// Index
app.get('/', function(req, res) {
  authProvider.renderLanding(req, res);
});

// Signin
app.get(/^\/signin\/?$/, function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      console.err(err);
    }
    res.render('signin', {
      track: config.track
    });
  });
});

// Signup
app.get(/^\/signup\/?$/, function(req, res) {
  res.render('signup', {
    temporary: req.session.temporary,
    track: config.track,
  });
});

// Signout
app.get(/^\/signout\/?$/, function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      console.err(err);
    }
    req.session = undefined;
    res.redirect('/');
  });
});

// Designs
app.get(/^\/ui\/([\w._-]+)\/designs\/?$/, function(req, res) {
  var username = decodeURIComponent(req.params[0]);
  res.render('designs', {
    user: username,
    temporary: req.session.temporary,
    firstTry: req.session.firstTry,
    signoutButton: ((authEngine === 'session') && !req.session.temporary),
    track: config.track,
  });
});

// Modeller
app.get(/^\/ui\/([\w._-]+)\/([\w-%]+)\/modeller$/, function(req, res) {
  var username = decodeURIComponent(req.params[0]);
  var design = decodeURIComponent(req.params[1]);
  res.render('modeller', {
    user: username,
    design: design,
    firstTry: req.session.firstTry,
    track: config.track,
    signoutButton: ((authEngine === 'session') && !req.session.temporary),
    temporary: req.session.temporary,
  });
  if (req.session.firstTry) {
    req.session.firstTry = false;
  }
});

module.exports = app;
