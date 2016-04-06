#!/usr/bin/env node
var ws = require('ws');
var net = require('net');

module.exports = {
  createDataStreamWebServer: createDataStreamWebServer,
  PiDataStreamServer: PiDataStreamServer
};

function createDataStreamWebServer(opts) {
  var webDataStreamServer = new ws.Server({port: opts.port});
  webDataStreamServer.on('connection', function onConnection() {
    console.log('New client connected to:', opts.name);
  });
  webDataStreamServer.broadcast = function broadcast(data) {
    for (var i in this.clients) {
      if (this.clients[i].readyState === 1) {
        this.clients[i].send(data);
      } else {
        console.log('ERROR: Client (' + i + ') not connected');
      }
    }
  };
  return webDataStreamServer;
}

function PiDataStreamServer(opts) {
  this.piSockets = {};
  var that = this;
  this.piDataStreamServer = net.createServer(function(socket) {
    socket.nameSet = false;
    socket.name = '';
    socket.setEncoding('utf8');
    socket.on('error', function onError() { console.log('Pi data stream socket error'); });
    socket.on('data', function onData(chunk) {
      if (!socket.nameSet) {
        chunk = chunk.split('~');
        socket.name = chunk[0];
        if (chunk.length > 1) {
          that.piSockets[socket.name] = socket;
          socket.nameSet = true;
          console.log('New Pi id:', socket.name);
          chunk.shift();
          chunk = chunk.join();
        } else {
          return;
        }
      }
      var chunks = chunk.split('|');
      var o = chunks[chunks.length > 2 ? 1 : 0].split(',').reduce(function(prev, curr) {
        curr = curr.split(':');
        prev[curr[0]] = curr[1];
        return prev;
      }, {});
      opts.clients[socket.name].broadcast(JSON.stringify(o));
    });
  });
  this.piDataStreamServer.on('connection', function onConnect() {
    console.log('New Pi connected to', opts.name, 'data stream server');
  });
  this.piDataStreamServer.listen(opts.port, function() {
    console.log(opts.name, 'data stream server listening on port:', opts.port);
    console.log('------------------------------------');
  });
}
