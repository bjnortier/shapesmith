var server = require('./server'),
    nconf = require('nconf');
   
var port = nconf.get('port');
app.listen(port);
console.info('--------------');
console.info('server started on :' + port + '\n');
