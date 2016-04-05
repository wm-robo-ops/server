#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var express = require('express');
var net = require('net');
var ws = require('ws');
var cors = require('cors');
var bodyParser = require('body-parser');
var random = require('./utils').random;
var Db = require('./db');

var app = express();
app.use(cors());
app.use(bodyParser.json());

var picName;

var DB = new Db();

var photosDir = './photos';
if (!fs.existsSync(photosDir)) {
  console.log('Creating photo directory');
  fs.mkdirSync(photosDir);
}

var PORT = '5555'; // for main http server

var BIG_DADDY = 'bigDaddy';
var SCOUT = 'scout';
var FLYER = 'flyer';
var vehicles = [BIG_DADDY, SCOUT, FLYER];

var cameras = {
  bigDaddyMain: { vehicle: BIG_DADDY, on: false, ip: '', nameReadable: 'Big Daddy Main', frameRate: 30, port: 8001 },
  bigDaddyArm: { vehicle: BIG_DADDY, on: false, ip: '', nameReadable: 'Big Daddy Arm', frameRate: 30, port: 8002 },
  scout: { vehicle: SCOUT, on: false, ip: '', nameReadable: 'Scout Main', frameRate: 30, port: 8003 },
  flyer: { vehicle: FLYER, on: false, ip: '', nameReadable: 'Flyer Main', frameRate: 30, port: 8004 }
};
var gps = {
  bigDaddy: { on: false, port: 4001 },
  scout: { on: false, port: 4002 },
  flyer: { on: false, port: 4003 }
};
var dofDevice = {
  bigDaddy: { on: false, port: 3001 },
  scout: { on: false, port: 3002 },
  flyer: { on: false, port: 3003 }
};

var center = [-95.081320, 29.564835];

app.get('/', function(req, res) {
  res.send('sup ;)');
});

app.post('/password', function password(req, res) {
  console.log('WEB: Authentication');
  if (req.body.password === process.env.ROBO_OPS_PASSWORD) {
    res.send('ok');
  } else {
    res.send('incorrect password');
  }
});

app.get('/stats', function stats(req, res) {
  var resData = {
    cameras: cameras,
    gps: gps,
    dofDevice: dofDevice
  };
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

app.post('/video/:stream/:status', function toggleVideo(req, res) {
  var stream = req.params.stream,
      status = req.params.status;
  var ok;
  if (status === 'on') {
    console.log('Command: turn ON video -', stream);
    ok = piCommandServer.sendCommand(commands.START_VIDEO_STREAM(30), '192.168.1.133');
    if (ok) cameras[stream].on = true;
  } else if (status === 'off') {
    console.log('Command: turn OFF video -', stream);
    ok = piCommandServer.sendCommand(commands.STOP_VIDEO_STREAM, '192.168.1.133');
    if (ok) cameras[stream].on = false;
  }
  if (ok) {
    res.send('ok');
  } else {
    res.status(500).send('ERROR: Could not toggle camera - ' + stream);
  }
});

app.post('/video/framerate/:camera/:frameRate', function changeFrameRate(req, res) {
  var camera = req.params.camera,
      frameRate = req.params.frameRate;
  console.log('Command: change', camera, 'framerate to', frameRate);
  var stop = piCommandServer.sendCommand(commands.STOP_VIDEO_STREAM, '192.168.1.133');
  var start = piCommandServer.sendCommand(commands.START_VIDEO_STREAM(frameRate), '192.168.1.133');
  if (stop && start) {
    cameras[camera].frameRate = frameRate;
    res.send('ok');
  } else {
    res.status(500).send('ERROR: Could not change frame rate to', frameRate, 'for', camera);
  }

});

app.post('/dofdevice/:vehicle/:status', function gpsToggle(req, res) {
  var vehicle = req.params.vehicle,
      status = req.params.status;
  var ok;
  if (status === 'on') {
    console.log('Command: turn ON dof device - ', vehicle);
    ok = piCommandServer.sendCommand(commands.START_DIRECTION_STREAM, '192.168.1.133');
    if (ok) dofDevice[vehicle].on = true;
  } else if (status === 'off') {
    console.log('Command: turn OFF dof device - ', vehicle);
    ok = piCommandServer.sendCommand(commands.STOP_DIRECTION_STREAM, '192.168.1.133');
    if (ok) dofDevice[vehicle].on = false;
  }
  if (ok)
    res.send('ok');
  else res.status(500).send('ERROR: Could not toggle DOF device - ' + vehicle);
});

app.post('/gps/:vehicle/:on', function gpsToggle(req, res) {
  console.log('WEB:');
  var vehicle = req.params.vehicle,
      status = req.params.status;
  var ok;
  if (status === 'on') {
    console.log('Command: turn ON GPS -', vehicle);
    ok = piCommandServer.sendCommand(commands.START_GPS_STREAM);
    if (ok) gps[vehicle].on = true;
  } else if (status === 'off') {
    console.log('Command: turn OFF GPS -', vehicle);
    ok = piCommandServer.sendCommand(commands.STOP_GPS_STREAM);
    if (ok) gps[vehicle].on = false;
  }
  if (ok)
    res.send('ok');
  else
    res.status(500).send('ERROR: Could not toggle GPS device - ' + vehicle);
});

app.post('/photo/:name', function capturePhoto(req, res) {
  var name = req.params.name;
  console.log('Command: capture photo -', name);
  picName = name;
  piCommandServer.sendCommand('START:CAPTURE_PHOTO:' + name + '|', '192.168.1.133');
  res.send('ok');
});

// serve photo directory
app.use(express.static(path.join(__dirname, '/photos')));
app.get('/photo', function sendPhoto(req, res) {
  var pics = fs.readdirSync('./photos');
  res.send(pics);
});

app.listen(PORT, function() {
  console.log('WEB - stats/rocks server port:', PORT);
});

/************************************************************************************
 * command socket
 */
var commands = {
  START_VIDEO_STREAM: function(fm) { return 'START:VIDEO_STREAM:' + fm + '|'; },
  STOP_VIDEO_STREAM: 'STOP:VIDEO_STREAM|',
  START_DIRECTION_STREAM: 'START:DIRECTION_STREAM|',
  STOP_DIRECTION_STREAM: 'STOP:DIRECTION_STREAM|',
  START_GPS_STREAM: 'START:DIRECTION_STREAM|',
  STOP_GPS_STREAM: 'START:GPS_STREAM|',
  PAN: 'START:PAN_TILT:5:5|'
};

var piCommandServer = new PiCommandServer(9998);

function PiCommandServer(port) {
  this.sockets = {};
  this.port = port;
  this.connected = false;
  var that = this;
  this.server = net.createServer(function(socket) {
    socket.nameSet = false;
    socket.name = '';
    socket.setEncoding('utf8');
    socket.on('error', function onError(error) { console.log('Socket Error: ', error); });
    socket.on('data', function onData(chunk) {
      if (!socket.nameSet) {
        chunk = chunk.split('~');
        socket.name += chunk[0];
        if (chunk.length > 1) {
          socket.nameSet = true;
          that.sockets[socket.name] = socket;
          console.log('New Pi name:', socket.name);
          chunk = chunk[1];
        }
      }
    });
    socket.on('close', function onClose() {
      console.log('Pi disconnected:', socket.name);
      delete that.sockets[socket.name];
    });
  });
  this.server.on('connection', function onConnection(/*s*/) {
    console.log('New pi connected to command server');
  });
  this.server.listen(this.port, function() {
    console.log('PI - command server port:', that.port);
  });
}
PiCommandServer.prototype.sendCommand = function(command, device) {
  if (!(device in this.sockets)) {
    console.log(device, 'not connected');
    return false;
  }
  try {
    this.sockets[device].write(command);
  }
  catch (e) {
    if (e instanceof TypeError)
      console.log('ERROR: Pi not connected -', e);
    else
      console.log('ERROR: Could not send command -', e);
    return false;
  }
  return true;
};


/************************************************************************************
 * data stream servers
 */
var dofDeviceDataStreamWebServers = {
  '192.168.1.133': createDataStreamWebServer({
    port: 3001,
    name: 'big_daddy_dof_data_stream'
  }),
  scout: createDataStreamWebServer({
    port: 3002,
    name: 'scout_data_dof_stream'
  }),
  flyer: createDataStreamWebServer({
    port: 3003,
    name: 'flyer_data_dof_stream'
  })
};

var piDofDeviceStreamServer = new PiDataStreamServer({ // eslint-disable-line no-unused-vars
  name: 'dof device',
  port: 3000,
  clients: dofDeviceDataStreamWebServers
});

var piGPSStreamServer = new PiDataStreamServer({name: 'gps', port: 4000}); // eslint-disable-line no-unused-vars

function createDataStreamWebServer(opts) {
  var webDataStreamServer = new ws.Server({port: opts.port});
  webDataStreamServer.broadcast = function(data) {
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
  });
}

/************************************************************************************
 * photo stream socket
 */
var piPhotoStreamServer = net.createServer(function(socket) {
  socket.on('error', function onError(error) { console.log('Pi photo stream socket error:', error); });
  var wStream = fs.createWriteStream(photosDir + '/' + picName);
  socket.on('connect', function onConnect() { console.log('PHOTO: receiving'); });
  socket.on('data', function onData(chunk) {
    wStream.write(chunk);
  });
  socket.on('close', function onClose() { wStream.end(); });
});
piPhotoStreamServer.on('connection', function onConnect() {
  console.log('New pi connected to photo stream server');
});
piPhotoStreamServer.listen(7777, function() {
  console.log('PI - photo stream server port:', 7777);
  console.log('------------------------------------');
});
