var net = require('net');
var random = require('../utils').random;

var HOST = 'ec2-54-173-230-101.compute-1.amazonaws.com';
var PORT = 3000;

var client = new net.Socket();

client.connect(PORT, HOST, function() {
  client.write('192.168.1.142~');
  while (true) { // eslint-disable-line no-constant-condition
    client.write('roll:' + random(0, 360) + ',');
    client.write('pitch:' + random(0, 360) + ',');
    client.write('bearing:' + random(0, 360) + '|');
  }
});

client.on('close', function() {
  console.log('disconnected from server');
});
