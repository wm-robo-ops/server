#!/usr/bin/env node
/* eslint no-unused-vars:0 */

var net = require('net');

var webServer = new (require('ws').Server)({ port: 8888 });
webServer.on('connection', function onConnection(socket) {
  socket.send(JSON.stringify(commands));
  socket.on('message', function onMessage(command) {
    handleWebCommand(command);
  });
});

function handleWebCommand(command) {
  if (!piServer) return;
  piServer.sendCommand(command);
}

var piServer = new PiServer(9998);

function PiServer(port) {
  this.port = port;
  var that = this;
  this.server = net.createServer(function(socket) {
    that.socket = socket;
    socket.setEncoding('utf8');
    socket.on('connect', function onConnect() { console.log('Pi connected!'); });
    socket.on('error', function onError(error) { console.log('Socket Error: ', error); });
  });
  this.server.listen(this.port);
}

PiServer.prototype.sendCommand = function(command) {
  this.socket.write(commands[command]);
};

var commands = {
  START_VIDEO_STREAM: 'START:VIDEO_STREAM|',
  STOP_VIDEO_STREAM: 'STOP:VIDEO_STREAM|',
  START_DIRECTION_SENSOR: 'START:DIRECTION_SENSOR',
  STOP_DIRECTION_SENSOR: 'STOP:DIRECTION_SENSOR',
  START_GPS_SENSOR: 'START:DIRECTION_SENSOR',
  STOP_GPS_SENSOR: 'START:GPS_SENSOR'
};

