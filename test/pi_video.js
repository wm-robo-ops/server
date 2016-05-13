#!/usr/bin/env node
var net = require('net');

var client = new net.Socket();

client.connect(8000, 'ec2-54-173-230-101.compute-1.amazonaws.com', function() {
  client.write('192.168.1.' + (process.argv[2] || 133) + '~');
  process.stdin.on('readable', function() {
    client.write(process.stdin.read());
  });
  process.stdin.on('error', function(e) {
    console.log(e);
  });
});
