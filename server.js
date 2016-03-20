#!/usr/bin/env node

var express = require('express');
var net = require('net');
var cors = require('cors');
var bodyParser = require('body-parser');
var utils = require('./utils');
var Db = require('./db');

var app = express();
app.use(cors());
app.use(bodyParser.json());

var DB = new Db();

var PORT = '5555';

var random = utils.random;

var BIG_DADDY = 'bigDaddy';
var SCOUT = 'scout';
var FLYER = 'flyer';
var vehicles = [BIG_DADDY, SCOUT, FLYER];

var cameras = {
  bigDaddyMain: {
    on: false
  },
  bigDaddyArm: {
    on: false
  },
  scout: {
    on: false
  },
  flyer: {
    on: false
  }
};

var center = [-95.081320, 29.564835];

app.get('/stats', function stats(req, res) {
  var resData = { cameras: cameras };
  resData.vehicles = vehicles.reduce(function(p, c) {
    p[c] = {
      batteryLevel: random(0, 100, true),
      networkSpeed: random(0, 10, true),
      location: [
        random(center[0] - 0.0004, center[0] + 0.0004),
        random(center[1] - 0.0004, center[1] + 0.0004)
      ],
      bearing: random(0, 180, true),
      pitch: [random(0, 2 * Math.PI), random(0, 2 * Math.PI), random(0, 2 * Math.PI)]
    };
    return p;
  }, {});
  res.send(resData);
});

app.get('/rocks', function rocks(req, res) {
  DB.getRocks(function dbRocksGet(e, data) {
    if (e) {
      console.log(e);
      res.status(500).send(e);
    } else {
      res.send(data);
    }
  });
});

app.post('/rocks/add', function rocksAdd(req, res) {
  DB.addRock(req.body, function dbRocksRemove(e) {
    if (e) {
      console.log(e);
      res.status(500).send();
    } else {
      res.send('ok');
    }
  });
});

app.delete('/rocks/remove/:id', function rocksRemove(req, res) {
  DB.removeRock(req.params.id, function dbRocksRemove(e) {
    if (e) {
      console.log(e);
      res.status(500).send();
    } else {
      res.send('ok');
    }
  });
});

app.post('/video/:stream/:on', function toggleVideo(req, res) {
  var ok = piCommandServer.sendCommand(commands.START_VIDEO_STREAM);
  cameras.flyer.on = true;
  if (ok)
    res.send('ok');
  else
    res.status(500).send('ERROR: Could not toggle camera');
});

app.listen(PORT, function() {
  console.log('Web - stats/rocks server port:', PORT);
});


/************************************************************************************/
/*
 * command socket
 */
var commands = {
  START_VIDEO_STREAM: 'START:VIDEO_STREAM:30|',
  STOP_VIDEO_STREAM: 'STOP:VIDEO_STREAM:30|',
  START_DIRECTION_SENSOR: 'START:DIRECTION_SENSOR|',
  STOP_DIRECTION_SENSOR: 'STOP:DIRECTION_SENSOR|',
  START_GPS_SENSOR: 'START:DIRECTION_SENSOR|',
  STOP_GPS_SENSOR: 'START:GPS_SENSOR|',
  PAN: 'START:PAN_TILT:5:5|'
};

var piCommandServer = new PiCommandServer(9998); // eslint-disable-line no-unused-vars

function PiCommandServer(port) {
  this.port = port;
  this.connected = false;
  var that = this;
  this.server = net.createServer(function(socket) {
    socket.setEncoding('utf8');
    socket.on('error', function onError(error) { console.log('Socket Error: ', error); });
    socket.on('data', function onData(chunk) { console.log(chunk); });
  });
  this.server.on('connection', function onConnection(s) {
    console.log('New pi connected to command server');
    that.socket = s;
    that.connected = true;
  });
  this.server.listen(this.port, function() {
    console.log('Pi - command server port:', that.port);
  });
}

PiCommandServer.prototype.sendCommand = function(/*command*/) {
  //while (!this.connected) {} // eslint-disable-line no-empty
  //this.socket.write(commands[command]);
  return true;
};


/************************************************************************************/
/*
 * data stream socket
 */
var piDataStreamServer = net.createServer(function(socket) {
  socket.setEncoding('utf8');
  socket.on('error', function onError() { console.log('Pi socket error'); });
  socket.on('data', function onData(chunk) {
    var chunks = chunk.split('|');

    var o = chunks[chunks.length > 2 ? 1 : 0].split(',').reduce(function(prev, curr) {
      curr = curr.split(':');
      prev[curr[0]] = curr[1];
      return prev;
    }, {});

    if (socketServer) {
      socketServer.broadcast(JSON.stringify(o));
    }
  });
});

piDataStreamServer.on('connection', function onConnect() {
  console.log('New pi connected to data stream server');
});

piDataStreamServer.listen(9000, function() {
  console.log('Pi - data stream server port:', 9000);
});

/**
 * Server for sending data stream to the web
 */
var socketServer = new (require('ws').Server)({ port: 9999 });
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

