#!/usr/bin/env node

var net = require('net');
var port = 9000;

/**
 * Server for getting data from Pi
 */
var piServer = net.createServer(function(socket) {
  socket.setEncoding('utf8');
  socket.on('connect', function() { console.log('New pi connection'); });
  socket.on('error', function() { console.log('Pi socket error'); });
  socket.on('data', function(chunk) {
    var data = chunk.split('|');

    var o = data[data.length > 2 ? 1 : 0].split(',').reduce(function(prev, curr) {
      curr = curr.split(':');
      prev[curr[0]] = curr[1];
      return prev;
    }, {});

    if (socketServer) {
      socketServer.broadcast(JSON.stringify(o));
    }
  });
});

piServer.listen(port, function() {
  console.log('Pi server listening on port: ' + port);
});

/**
 * Server for sending data to the web
 */
var socketServer = new (require('ws').Server)({port: 9999});
socketServer.broadcast = function(data) {
  for (var i in this.clients) {
    if (this.clients[i].readyState === 1) {
      this.clients[i].send(data);
    }
    else {
      console.log('Error: Client (' + i + ') not connected.');
    }
  }
};
