#!/usr/bin/env node
var net = require('net');

var client = new net.Socket();

client.connect(8000, 'localhost', function() {
  client.write('192.168.1.133~');
  process.stdin.on('readable', function() {
    client.write(process.stdin.read());
  });
  process.stdin.on('error', function(e) {
    console.log(e);
  });
});
