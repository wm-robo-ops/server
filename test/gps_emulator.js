var net = require('net');
var random = require('../utils').random;

var HOST = 'localhost';
var PORT = 4000;

var client = new net.Socket();

var lat, lon;

client.connect(PORT, HOST, function() {
  client.write('192.168.1.133~');
  while (true) { // eslint-disable-line no-constant-condition
    lon = -95.081505 + random(0, 0.0001);
    lat = 29.564962 + random(0, 0.0001);
    client.write('lat:' + lat + ',');
    client.write('lon:' + lon + '|');
  }
});

client.on('close', function() {
  console.log('disconnected from server');
});
