#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var express = require('express');
var net = require('net');
var cors = require('cors');
var bodyParser = require('body-parser');
var random = require('./utils').random;
var Db = require('./db');

var app = express();
app.use(cors());
app.use(bodyParser.json());

var picName;

// initialize rock database
var DB = new Db();

// create photos directory if id doesn't exist
var photosDir = './photos';
if (!fs.existsSync(photosDir)) {
  console.log('Creating photo directory');
  fs.mkdirSync(photosDir);
}

var STATS_SERVER_PORT = '5555';
var PHOTO_STREAM_PORT = '7000';

var BIG_DADDY = 'bigDaddy';
var SCOUT = 'scout';
var FLYER = 'flyer';
var vehicles = [BIG_DADDY, SCOUT, FLYER];

var deviceIds = {
  camera: {
    bigDaddyMain: '192.168.1.133',
    bigDaddyMount1: '192.168.1.121',
    bigDaddyArm: '192.168.1.133',
    scout: '192.168.1.133',
    rover: '192.168.1.133'
  },
  gps: {
    bigDaddy: '192.168.1.133',
    scout: '192.168.1.133',
    rover: '192.168.1.133'
  },
  dof: {
    bigDaddy: '192.168.1.133',
    scout: '192.168.1.133',
    rover: '192.168.1.133'
  }
};

var cameras = {
  bigDaddyMain: { vehicle: BIG_DADDY, on: false, ip: '', nameReadable: 'Big Daddy Main', frameRate: 30, port: 8001 },
  bigDaddyMount1: { vehicle: BIG_DADDY, on: false, ip: '', nameReadable: 'Big Daddy Mount 1', frameRate: 30, port: 8002 },
  bigDaddyArm: { vehicle: BIG_DADDY, on: false, ip: '', nameReadable: 'Big Daddy Arm', frameRate: 30, port: 8003 },
  scout: { vehicle: SCOUT, on: false, ip: '', nameReadable: 'Scout Main', frameRate: 30, port: 8004 },
  flyer: { vehicle: FLYER, on: false, ip: '', nameReadable: 'Flyer Main', frameRate: 30, port: 8005 }
};
var gps = {
  bigDaddy: { on: false, port: 4001, name: 'bigDaddy' },
  scout: { on: false, port: 4002, name: 'scout' },
  flyer: { on: false, port: 4003, name: 'flyer' }
};
var dofDevice = {
  bigDaddy: { on: false, port: 3001, name: 'bigDaddy' },
  scout: { on: false, port: 3002, name: 'scout' },
  flyer: { on: false, port: 3003, name: 'flyer' }
};

var center = [-95.081320, 29.564835];

app.get('/', function(req, res) {
  res.send('sup ;)');
});

var location = {};

setInterval(function() {
  if (!(location.bigDaddy && location.scout && location.flyer)) return;
  bigDaddyTrace.push(location.bigDaddy);
  scoutTrace.push(location.scout);
  flyerTrace.push(location.flyer);
}, 30000);

var bigDaddyTrace = [];
var scoutTrace = [];
var flyerTrace = [];

var locationGeoj = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'bigDaddy',
        icon: 'bus'
      },
      geometry: {
        type: 'Point',
        coordinates: location.bigDaddy
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'scout',
        icon: 'car'
      },
      geometry: {
        type: 'Point',
        coordinates: location.scout
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'flyer',
        icon: 'airfield'
      },
      geometry: {
        type: 'Point',
        coordinates: location.flyer
      }
    }
  ]
};

var trace = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        vehicle: 'bigDaddy'
      },
      geometry: {
        type: 'LineString',
        coordinates: bigDaddyTrace
      }
    },
    {
      type: 'Feature',
      properties: {
        vehicle: 'scout'
      },
      geometry: {
        type: 'LineString',
        coordinates: scoutTrace
      }
    },
    {
      type: 'Feature',
      properties: {
        vehicle: 'flyer'
      },
      geometry: {
        type: 'LineString',
        coordinates: flyerTrace
      }
    }
  ]
};

app.get('/location', function loc(req, res) {
  locationGeoj.features[0].geometry.coordinates = location.bigDaddy || [0, 0];
  locationGeoj.features[1].geometry.coordinates = location.scout || [0, 0];
  locationGeoj.features[2].geometry.coordinates = location.flyer || [0, 0];
  res.send(locationGeoj);
});

app.get('/trace', function tr(req, res) {
  res.send(trace);
});

app.get('/stats', function stats(req, res) {
  var resData = {
    cameras: cameras,
    gps: gps,
    dofDevice: dofDevice
  };
  resData.vehicles = vehicles.reduce(function(p, c) {
    location[c] = [
      random(center[0] - 0.0004, center[0] + 0.0004),
      random(center[1] - 0.0004, center[1] + 0.0004)
    ];
    p[c] = {
      location: location[c]
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

app.get('/rocks/geojson', function rocksGeoj(req, res) {
  DB.getRocks(function dbRocksGet(e, data) {
    if (e) {
      console.log(e);
      res.status(500).send(e);
    } else {
      res.send({
        type: 'FeatureCollection',
        features: data.map(function(rock) {
          return {
            type: 'Feature',
            properties: {
              color: rock.color,
              id: rock.id
            },
            geometry: {
              type: 'Point',
              coordinates: [rock.lon, rock.lat]
            }
          };
        })
      });
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
    ok = piCommandServer.sendCommand(commands.START_VIDEO_STREAM(30), deviceIds.camera[stream]);
    if (ok) cameras[stream].on = true;
  } else if (status === 'off') {
    console.log('Command: turn OFF video -', stream);
    ok = piCommandServer.sendCommand(commands.STOP_VIDEO_STREAM, deviceIds.camera[stream]);
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
  var stop = piCommandServer.sendCommand(commands.STOP_VIDEO_STREAM, deviceIds.camera[camera]);
  var start = piCommandServer.sendCommand(commands.START_VIDEO_STREAM(frameRate), deviceIds.camera[camera]);
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
    ok = piCommandServer.sendCommand(commands.START_DIRECTION_STREAM, deviceIds.dof[vehicle]);
    if (ok) dofDevice[vehicle].on = true;
  } else if (status === 'off') {
    console.log('Command: turn OFF dof device - ', vehicle);
    ok = piCommandServer.sendCommand(commands.STOP_DIRECTION_STREAM, deviceIds.dof[vehicle]);
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
    ok = piCommandServer.sendCommand(commands.START_GPS_STREAM, deviceIds.gps[vehicle]);
    if (ok) gps[vehicle].on = true;
  } else if (status === 'off') {
    console.log('Command: turn OFF GPS -', vehicle);
    ok = piCommandServer.sendCommand(commands.STOP_GPS_STREAM, deviceIds.gps[vehicle]);
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

app.listen(STATS_SERVER_PORT, function() {
  console.log('WEB - stats/rocks server port:', STATS_SERVER_PORT);
});

/************************************************************************************
 * command server
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

var piCommandServer = new PiCommandServer(9000);

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
 * photo stream server
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
piPhotoStreamServer.listen(PHOTO_STREAM_PORT, function() {
  console.log('PI - photo stream server port:', PHOTO_STREAM_PORT);
  console.log('------------------------------------');
});
