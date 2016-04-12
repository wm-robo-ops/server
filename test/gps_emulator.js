var net = require('net');

var HOST = 'localhost';
var PORT = 4000;

var client = new net.Socket();

client.connect(PORT, HOST, function() {
  client.write('192.168.1.133~');
  var c = 0;
  while (true) { // eslint-disable-line no-constant-condition
    client.write(JSON.stringify({lat: ++c, lon: ++c}) + '|');
  }
});

client.on('close', function() {
  console.log('disconnected from server');
});
