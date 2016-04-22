#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var express = require('express');
var net = require('net');
var cors = require('cors');
var bodyParser = require('body-parser');
var Db = require('./db');
var exec = require('child_process').exec;

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

var STATS_SERVER_PORT = '6000';
var PHOTO_STREAM_PORT = '7000';
var GPS_STREAM_PORT = 4000;

var MOUNT_KOSMO_LAT = '-95.081505';
var MOUNT_KOSMO_LON = '29.564962';

var BIG_DADDY = 'bigDaddy';
var SCOUT = 'scout';
var FLYER = 'flyer';

var deviceIds = {
  camera: {
    bigDaddyMain: '192.168.1.133',
    bigDaddyMount1: '192.168.1.121',
    bigDaddyArm: '192.168.1.151',
    scout: '192.168.1.142',
    flyer: '192.168.1.000'
  },
  gps: {
    bigDaddy: '192.168.1.134',
    scout: '192.168.1.000',
    flyer: '192.168.1.000'
  },
  dof: {
    bigDaddy: '192.168.1.000',
    scout: '192.168.1.000',
    flyer: '192.168.1.000'
  }
};

var cameras = {
  bigDaddyMain: {
    vehicle: BIG_DADDY,
    on: false,
    ip: '',
    nameReadable: 'Big Daddy Main',
    frameRate: 30,
    port: 8001
  },
  bigDaddyMount1: {
    vehicle: BIG_DADDY,
    on: false,
    ip: '',
    nameReadable: 'Big Daddy Mount 1',
    frameRate: 30,
    port: 8002
  },
  bigDaddyArm: {
    vehicle: BIG_DADDY,
    on: false,
    ip: '',
    nameReadable: 'Big Daddy Arm',
    frameRate: 30,
    port: 8003
  },
  scout: {
    vehicle: SCOUT,
    on: false,
    ip: '',
    nameReadable: 'Scout Main',
    frameRate: 30,
    port: 8004
  },
  flyer: {
    vehicle: FLYER,
    on: false,
    ip: '',
    nameReadable: 'Flyer Main',
    frameRate: 30,
    port: 8005
  }
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

app.get('/', function(req, res) {
  res.send('sup ;)');
});

var location = {};

// sample location every 30 seconds
setInterval(function() {
  if (location.bigDaddy) {
    bigDaddyTrace.push(location.bigDaddy);
  }
  if (location.scout) {
    scoutTrace.push(location.scout);
  }
  if (location.flyer) {
    flyerTrace.push(location.flyer);
  }
  fs.writeFileSync('./trace.geojson', JSON.stringify(getTraceGeoj()));
}, 30000);

// delete trace every 1 hour - REMEMBER TO REMOVE
setInterval(function() {
  bigDaddyTrace.length = 0;
  scoutTrace.length = 0;
  flyerTrace.length = 0;
}, 3600000);

var bigDaddyTrace = [];
var scoutTrace = [];
var flyerTrace = [];

// read in cached trace data
try {
  var traceCache = JSON.parse(fs.readFileSync('./trace.geojson'));
  if (traceCache.features.some(function(f) { return f.properties.vehicle === 'bigDaddy'; })) {
    bigDaddyTrace = traceCache.features.filter(function(f) { return f.properties.vehicle === 'bigDaddy'; })[0].geometry.coordinates;
  }
  if (traceCache.features.some(function(f) { return f.properties.vehicle === 'scout'; })) {
    scoutTrace = traceCache.features.filter(function(f) { return f.properties.vehicle === 'scout'; })[0].geometry.coordinates;
  }
  if (traceCache.features.some(function(f) { return f.properties.vehicle === 'flyer'; })) {
    flyerTrace = traceCache.features.filter(function(f) { return f.properties.vehicle === 'flyer'; })[0].geometry.coordinates;
  }
} catch (e) {
  console.log('SETUP: trace.geojson does not exist yet');
  console.log('---------------------------------------');
}

var emptyGeoj = { type: 'FeatureCollection', features: [] };

function getLocationGeoj() {
  var locationGeoj = {
    type: 'FeatureCollection',
    features: []
  };
  if (location.bigDaddy) {
    locationGeoj.features.push({
      type: 'Feature',
      properties: {
        name: 'bigDaddy',
        icon: 'bus'
      },
      geometry: {
        type: 'Point',
        coordinates: location.bigDaddy
      }
    });
  }
  if (location.scout) {
    locationGeoj.features.push({
      type: 'Feature',
      properties: {
        name: 'scout',
        icon: 'car'
      },
      geometry: {
        type: 'Point',
        coordinates: location.scout
      }
    });
  }
  if (location.flyer) {
    locationGeoj.features.push({
      type: 'Feature',
      properties: {
        name: 'flyer',
        icon: 'airfield'
      },
      geometry: {
        type: 'Point',
        coordinates: location.flyer
      }
    });
  }
  return locationGeoj;
}

function getTraceGeoj() {
  var trace = {
    type: 'FeatureCollection',
    features: []
  };
  if (bigDaddyTrace.length) {
    trace.features.push({
      type: 'Feature',
      properties: {
        vehicle: 'bigDaddy'
      },
      geometry: {
        type: 'LineString',
        coordinates: bigDaddyTrace
      }
    });
  }
  if (scoutTrace.length) {
    trace.features.push({
      type: 'Feature',
      properties: {
        vehicle: 'scout'
      },
      geometry: {
        type: 'LineString',
        coordinates: scoutTrace
      }
    });
  }
  if (flyerTrace.length) {
    trace.features.push({
      type: 'Feature',
      properties: {
        vehicle: 'flyer'
      },
      geometry: {
        type: 'LineString',
        coordinates: flyerTrace
      }
    });
  }
  return trace;
}

// location of vehicles
app.get('/location', function loc(req, res) {
  res.send(getLocationGeoj());
});

// trace data
app.get('/trace', function tr(req, res) {
  res.send(getTraceGeoj());
});

// vehicle device information
app.get('/stats', function stats(req, res) {
  var resData = {
    cameras: cameras,
    gps: gps,
    dofDevice: dofDevice
  };
  res.send(resData);
});

// get rocks
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

// get rock geojson data
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

// run TSP and return optimal path between rocks as geojson
app.get('/path', function tsp(req, res) {
  DB.getRocks(function dbRocksGet(e, data) {
    if (e) {
      console.log(e);
      return res.status(500).send(e);
    }
    var fileName = path.join(__dirname, '/nodes.txt');
    if (!location.bigDaddy || data.length === 0) {
      return res.send(emptyGeoj);
    }
    var initNodes = MOUNT_KOSMO_LAT + ':' + MOUNT_KOSMO_LON + ':' + 'kosmo\n';
    initNodes += location.bigDaddy[1].toString() + ':' + location.bigDaddy[0].toString() + ':' + 'bigDaddy\n';
    fs.writeFileSync(fileName, initNodes);
    for (var i = 0; i < data.length; i++) {
      var value = data[i];
      var line = value.lat + ':' + value.lon + ':' + value.color + '\n';
      fs.appendFileSync(fileName, line);
    }
    exec('./TSP', function callback(error, stdout) {
      var out = JSON.parse(stdout.toString());
      res.send({
        type: 'Feature',
        properties: {
          type: 'path'
        },
        geometry: {
          type: 'LineString',
          coordinates: out.nodes.slice(1, out.nodes.length - 1).map(function(coords) {
            return [+coords.lon, +coords.lat];
          })
        }
      });
    });
  });
});

// add a new rock
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

// remove a rock
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

// toggle video streams
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

// change video frame rate
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

// toggle dof device
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

// toggle gps device
app.post('/gps/:vehicle/:status', function gpsToggle(req, res) {
  console.log('WEB:');
  var vehicle = req.params.vehicle,
      status = req.params.status;
  var ok;
  if (status === 'on') {
    console.log('Command: turn ON GPS -', vehicle);
    console.log(deviceIds.gps[vehicle]);
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

// capture a photo
app.post('/photo/:camera/:name', function capturePhoto(req, res) {
  var name = req.params.name,
      camera = req.params.camera;
  console.log('Command: capture photo -', name);
  picName = name;
  piCommandServer.sendCommand('START:CAPTURE_PHOTO:' + name + '|', deviceIds.camera[camera]);
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
  START_GPS_STREAM: 'START:GPS_STREAM|',
  STOP_GPS_STREAM: 'STOP:GPS_STREAM|',
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
  this.server.on('connection', function onConnection() {
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
 * gps stream server
 */
var piGPSStreamServer = net.createServer(function(socket) {
  socket.setEncoding('utf8');
  socket.nameSet = false;
  socket.name = '';
  socket.on('error', function onError(error) { console.log('Pi GPS stream socket error:', error); });
  socket.on('connect', function onConnect() { console.log('GPS: new Pi connected'); });
  socket.on('data', function onData(chunk) {
    if (!socket.nameSet) {
      chunk = chunk.split('~');
      socket.name = chunk[0];
      if (chunk.length > 1) {
        socket.nameSet = true;
        console.log('New Pi id:', socket.name);
        chunk.shift();
        chunk = chunk.join();
      } else {
        return;
      }
    }
    chunk = chunk.split('|');
    if (chunk.length > 1) {
      try {
        var latLon = chunk[0].split(',').reduce(function(prev, curr) {
          curr = curr.split(':');
          prev[curr[0]] = +curr[1];
          return prev;
        }, {});
        setGPS(socket.name, latLon);
      } catch (e) {
        return;
      }
    }
  });
  socket.on('close', function onClose() { console.log('GPS socket closed:', socket.name); });
});
piGPSStreamServer.listen(GPS_STREAM_PORT, function listen() {
  console.log('PI - gps stream server port:', GPS_STREAM_PORT);
});

function setGPS(device, loc) {
  switch (device) {
  case deviceIds.gps.bigDaddy:
    location.bigDaddy = [loc.lon, loc.lat];
    return;
  case deviceIds.gps.scout:
    location.scout = [loc.lon, loc.lat];
    return;
  case deviceIds.gps.flyer:
    location.flyer = [loc.on, loc.lat];
    return;
  }
}

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
