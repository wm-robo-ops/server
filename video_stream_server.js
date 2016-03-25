#!/usr/bin/env node

var net = require('net');
var STREAM_PORT = 8082,
    WEBSOCKET_PORT = 8084,
    STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

var width = 320,
    height = 240;

// Websocket Server
var socketServer = new (require('ws').Server)({port: WEBSOCKET_PORT});
socketServer.on('connection', function onConnection(socket) {
  // Send magic bytes and video size to the newly connected socket
  // struct { char magic[4]; unsigned short width, height; }
  var streamHeader = new Buffer(8);
  streamHeader.write(STREAM_MAGIC_BYTES);
  streamHeader.writeUInt16BE(width, 4);
  streamHeader.writeUInt16BE(height, 6);
  socket.send(streamHeader, {binary: true});

  console.log('New WebSocket Connection (' + socketServer.clients.length + ' total)');

  socket.on('close', function onClose(/*code, message*/) {
    console.log('Disconnected WebSocket (' + socketServer.clients.length + ' total)');
  });
});

socketServer.broadcast = function(data, opts) {
  for(var i in this.clients) {
    if (this.clients[i].readyState === 1) {
      this.clients[i].send(data, opts);
    } else {
      console.log('Error: Client (' + i + ') not connected.');
    }
  }
};

// HTTP Server to accept incoming MPEG Stream
/*
var streamServer = require('http').createServer(function(request) {
  console.log('Stream Connected: ' + request.socket.remoteAddress +
      ':' + request.socket.remotePort + ' size: ' + 320 + 'x' + 340);
  request.on('data', function onData(data){
    socketServer.broadcast(data, {binary: true});
  });
});

streamServer.listen(STREAM_PORT);
*/
var streamServer = net.createServer(function(socket) {
  console.log('Stream connected');
  socket.on('data', function onData(data) {
    socketServer.broadcast(data, {binary: true});
  });
});
streamServer.listen(8082);

console.log('PI: video stream server port:', STREAM_PORT);
console.log('WEB: video stream server port:', WEBSOCKET_PORT);
