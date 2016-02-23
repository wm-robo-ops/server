var express = require('express');
var app = express();

var BIG_DADDY = 'bigDaddy';
var SCOUT = 'scout';
var FLYER = 'flyer';
var vehicles = [BIG_DADDY, SCOUT, FLYER];

var center = [-95.081320, 29.564835];

app.get('/stats', function(req, res) {
  res.send(vehicles.reduce(function(p, c) {
    p[c] = {
      batteryLevel: random(0, 100, true),
      networkSpeed: random(0, 10, true),
      location: [
        random(center[0] - 0.0001, center[0] + 0.0001),
        random(center[1] - 0.0001, center[1] + 0.0001)
      ],
      bearing: random(0, 180, true)
    };
    return p;
  }, {}));
});


function random(min, max, integer) {
  var d = max - min;
  var n = Math.random() * d + min;
  n = integer ? Math.floor(n) + 1 : n;
  return n;
}

app.listen('3000');
