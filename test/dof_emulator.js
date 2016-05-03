var net = require('net');
var random = require('../utils').random;

var HOST = 'localhost';
var PORT = 3000;

var client = new net.Socket();

client.connect(PORT, HOST, function() {
  client.write('192.168.1.200~');
  while (true) { // eslint-disable-line no-constant-condition
    client.write('roll:' + random(0, 360) + ',');
    client.write('pitch:' + random(0, 360) + ',');
    client.write('bearing:' + random(0, 360) + '|');
  }
});

client.on('close', function() {
  console.log('disconnected from server');
});
