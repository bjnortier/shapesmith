var http = require('http');
var app = require('./app');
var nconf = require('nconf');


var port = nconf.get('port');
var server = http.createServer(app);
server.listen(port, function() {
  console.info('server started on :' + port + '\n');
});


