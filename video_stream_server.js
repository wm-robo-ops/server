#!/usr/bin/env node

var net = require('net');
var ws = require('ws');

var PI_STREAM_PORT = 8000,
    STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

var width = 320,
    height = 240;

var servers = {
  '192.168.1.133': createWebSocketServer({ port: 8001 }),
  '192.168.1.121': createWebSocketServer({ port: 8002 }),
  bigDaddyArm: createWebSocketServer({ port: 8003 }),
  scout: createWebSocketServer({ port: 8004 }),
  flyer: createWebSocketServer({ port: 8005 })
};
function createWebSocketServer(opts) {
  var socketServer = new ws.Server({port: opts.port});
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

  socketServer.broadcast = function(data, o) {
    for(var i in this.clients) {
      if (this.clients[i].readyState === 1) {
        this.clients[i].send(data, o);
      } else {
        console.log('Error: Client (' + i + ') not connected.');
      }
    }
  };
  return socketServer;
}

// Server to accept incoming MPEG Stream
var streamServer = net.createServer(function(socket) {
  this.piSockets = {};
  var that = this;
  console.log('Stream connected');
  socket.on('data', function onData(chunk) {
      if (!socket.nameSet) {
        chunk = chunk.toString('utf8').split('~');
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
      servers[socket.name].broadcast(chunk, {binary: true});
  });
});
streamServer.listen(PI_STREAM_PORT);

