#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var express = require('express');
var compression = require('compression');
var net = require('net');
var cors = require('cors');
var bodyParser = require('body-parser');
var Db = require('./db');
var exec = require('child_process').exec;
var devices = require('./devices');
var log = require('./utils').log;

var app = express();

// middleware
app.use(cors());
app.use(bodyParser.json());
app.use(compression())

var picName;

// initialize rock database
var DB = new Db();

// create photos directory if id doesn't exist
var photosDir = './photos';
if (!fs.existsSync(photosDir)) {
  log('Creating photo directory');
  fs.mkdirSync(photosDir);
}

var STATS_SERVER_PORT = '8080';
var PHOTO_STREAM_PORT = '7000';
var GPS_STREAM_PORT = 4000;

var MOUNT_KOSMO_LAT = '-95.081505';
var MOUNT_KOSMO_LON = '29.564962';

var cameras = Object.keys(devices.cameras).reduce(function(out, key) {
  out[key] = devices.cameras[key];
  out[key].on = false;
  out[key].frameRate = 30;
  return out;
}, {});

var gps = Object.keys(devices.gps).reduce(function(out, key) {
  out[key] = devices.gps[key];
  out[key].on = false;
  return out;
}, {});

var dofDevice = Object.keys(devices.dof).reduce(function(out, key) {
  out[key] = devices.dof[key];
  out[key].on = false;
  return out;
}, {});

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
    bigDaddyTrace = traceCache.features
      .filter(function(f) {
        return f.properties.vehicle === 'bigDaddy';
      })[0].geometry.coordinates;
  }
  if (traceCache.features.some(function(f) { return f.properties.vehicle === 'scout'; })) {
    scoutTrace = traceCache.features
      .filter(function(f) {
        return f.properties.vehicle === 'scout';
      })[0].geometry.coordinates;
  }
  if (traceCache.features.some(function(f) { return f.properties.vehicle === 'flyer'; })) {
    flyerTrace = traceCache.features
      .filter(function(f) {
        return f.properties.vehicle === 'flyer';
      })[0].geometry.coordinates;
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
    dofDevice: dofDevice,
    vehicleGeoJSON: getLocationGeoj(),
    startTime: startTime
  };
  res.send(resData);
});

// get rocks
app.get('/rocks', function rocks(req, res) {
  DB.getRocks(function dbRocksGet(e, data) {
    if (e) {
      log(e);
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
      log(e);
      res.status(500).send(e);
    } else {
      res.send({
        type: 'FeatureCollection',
        features: data.map(function(rock) {
          return {
            type: 'Feature',
            properties: {
              color: rock.color,
              id: rock.id,
              name: rock.name
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

var startTime = false;
app.post('/start_time/set/:time', function setStartTime(req, res) {
  startTime = req.params.time;
  res.send('ok');
});

app.get('/start_time', function getStartTime(req, res) {
  res.send(startTime);
});

// run TSP and return optimal path between rocks as geojson
app.get('/path', function tsp(req, res) {
  DB.getRocks(function dbRocksGet(e, data) {
    if (e) {
      log(e);
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
      log(e);
      res.status(500).send(e);
    } else {
      res.send('ok');
    }
  });
});

// remove a rock
app.delete('/rocks/remove/:id', function rocksRemove(req, res) {
  DB.removeRock(req.params.id, function dbRocksRemove(e) {
    if (e) {
      log(e);
      res.status(500).send(e);
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
    log('Command: turn ON video - ' + stream);
    ok = piCommandServer.sendCommand(commands.START_VIDEO_STREAM(30), devices.cameras[stream].device);
    if (ok) cameras[stream].on = true;
  } else if (status === 'off') {
    log('Command: turn OFF video - ' + stream);
    ok = piCommandServer.sendCommand(commands.STOP_VIDEO_STREAM, devices.cameras[stream].device);
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
  log('Command: change ' + camera + ' framerate to ' + frameRate);
  var stop = piCommandServer.sendCommand(commands.STOP_VIDEO_STREAM, devices.cameras[camera].device);
  var start = piCommandServer.sendCommand(commands.START_VIDEO_STREAM(frameRate), devices.cameras[camera].device);
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
    log('Command: turn ON dof device - ' + vehicle);
    ok = piCommandServer.sendCommand(commands.START_DIRECTION_STREAM, devices.dof[vehicle].device);
    if (ok) dofDevice[vehicle].on = true;
  } else if (status === 'off') {
    log('Command: turn OFF dof device - ' + vehicle);
    ok = piCommandServer.sendCommand(commands.STOP_DIRECTION_STREAM, devices.dof[vehicle].device);
    if (ok) dofDevice[vehicle].on = false;
  }
  if (ok)
    res.send('ok');
  else res.status(500).send('ERROR: Could not toggle DOF device - ' + vehicle);
});

// toggle gps device
app.post('/gps/:vehicle/:status', function gpsToggle(req, res) {
  log('WEB:');
  var vehicle = req.params.vehicle,
      status = req.params.status;
  var ok;
  if (status === 'on') {
    log('Command: turn ON GPS - ' + vehicle);
    ok = piCommandServer.sendCommand(commands.START_GPS_STREAM, devices.gps[vehicle].device);
    if (ok) gps[vehicle].on = true;
  } else if (status === 'off') {
    log('Command: turn OFF GPS - ' + vehicle);
    ok = piCommandServer.sendCommand(commands.STOP_GPS_STREAM, devices.gps[vehicle].device);
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
  log('Command: capture photo - ' + name);
  picName = name;
  piCommandServer.sendCommand('START:CAPTURE_PHOTO:' + name + '|', devices.cameras[camera].device);
  res.send('ok');
});

// serve photo directory
app.use(express.static(path.join(__dirname, '/photos')));
app.get('/photo', function sendPhoto(req, res) {
  var pics = fs.readdirSync('./photos');
  res.send(pics);
});

app.listen(STATS_SERVER_PORT, function() {
  log('WEB - stats/rocks server port: ' + STATS_SERVER_PORT);
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
    socket.on('error', function onError(error) {
      log('Socket Error: ' + error);
      socket.destroy();
    });
    socket.on('data', function onData(chunk) {
      if (!socket.nameSet) {
        chunk = chunk.split('~');
        socket.name += chunk[0];
        if (chunk.length > 1) {
          socket.nameSet = true;
          that.sockets[socket.name] = socket;
          log('New Pi name: ' + socket.name);
          chunk = chunk[1];
        }
      }
    });
    socket.on('close', function onClose() {
      log('Pi disconnected: ' + socket.name);
      socket.destroy();
      delete that.sockets[socket.name];
    });
  });
  this.server.on('connection', function onConnection() {
    log('New pi connected to command server');
  });
  this.server.listen(this.port, function() {
    log('PI - command server port: ' + that.port);
  });
}

PiCommandServer.prototype.sendCommand = function(command, device) {
  if (!(device in this.sockets)) {
    log(device + ' not connected');
    return false;
  }
  try {
    this.sockets[device].write(command);
  }
  catch (e) {
    if (e instanceof TypeError)
      log('ERROR: Pi not connected - ' + e);
    else
      log('ERROR: Could not send command - ' + e);
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
  socket.on('error', function onError(error) {
    log('Pi GPS stream socket error: ' + error);
    socket.destroy();
  });
  socket.on('connect', function onConnect() { log('GPS: new Pi connected'); });
  socket.on('data', function onData(chunk) {
    if (!socket.nameSet) {
      chunk = chunk.split('~');
      socket.name = chunk[0];
      if (chunk.length > 1) {
        socket.nameSet = true;
        log('New Pi id: ' + socket.name);
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
  socket.on('close', function onClose() {
    log('GPS socket closed: ' + socket.name);
    socket.destroy();
  });
});
piGPSStreamServer.listen(GPS_STREAM_PORT, function listen() {
  log('PI - gps stream server port: ' + GPS_STREAM_PORT);
});

function setGPS(device, loc) {
  switch (device) {
  case devices.gps.bigDaddy.device:
    location.bigDaddy = [ loc.lon || location.bigDaddy[0], loc.lat || location.bigDaddy[1] ];
    return;
  case devices.gps.scout.device:
    location.scout = [ loc.lon || location.scout[0], loc.lat || location.scout[1] ];
    return;
  case devices.gps.flyer.device:
    location.flyer = [ loc.lon || location.flyer[0], loc.lat || location.flyer[1] ];
    return;
  }
}

/************************************************************************************
 * photo stream server
 */
var piPhotoStreamServer = net.createServer(function(socket) {
  socket.on('error', function onError(error) {
    log('Pi photo stream socket error: ' + error);
    socket.destroy();
  });
  var wStream = fs.createWriteStream(photosDir + '/' + picName);
  socket.on('connect', function onConnect() { log('PHOTO: receiving'); });
  socket.on('data', function onData(chunk) {
    wStream.write(chunk);
  });
  socket.on('close', function onClose() {
    wStream.end();
    socket.destroy();
  });
});
piPhotoStreamServer.on('connection', function onConnect() {
  log('New pi connected to photo stream server');
});
piPhotoStreamServer.listen(PHOTO_STREAM_PORT, function() {
  log('PI - photo stream server port: ' + PHOTO_STREAM_PORT);
  console.log('------------------------------------');
});
