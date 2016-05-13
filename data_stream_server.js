#!/usr/bin/env node
var ws = require('ws');
var net = require('net');
var log = require('./utils').log;

module.exports = {
  createDataStreamWebServer: createDataStreamWebServer,
  PiDataStreamServer: PiDataStreamServer
};

function createDataStreamWebServer(opts) {
  var webDataStreamServer = new ws.Server({port: opts.port});
  webDataStreamServer.broadcast = function broadcast(data) {
    for (var i in this.clients) {
      if (this.clients[i].readyState === 1) {
        this.clients[i].send(data);
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
    socket.on('error', function onError() { 
      log('Pi data stream socket error -> ' + socket.name); 
      socket.destroy();
    });
    socket.on('close', function onClose() {
      log('Pi data stream socket closed -> ' + socket.name);
      socket.destroy();
    });
    socket.on('data', function onData(chunk) {
      if (!socket.nameSet) {
        chunk = chunk.split('~');
        socket.name = chunk[0];
        if (chunk.length > 1) {
          that.piSockets[socket.name] = socket;
          socket.nameSet = true;
          log('New Pi id: ' + socket.name);
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
      try {
        opts.clients[socket.name].broadcast(JSON.stringify(o));
      }
      catch (e) {
        log(e);
      }
    });
  });
  this.piDataStreamServer.on('connection', function onConnect() {
    log('New Pi connected to ' + opts.name + ' server');
  });
  this.piDataStreamServer.listen(opts.port, function() {
    log(opts.name + ' data stream server listening on port: ' + opts.port);
    console.log('------------------------------------');
  });
}
