#!/usr/bin/env node

var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var utils = require('./utils');
var Db = require('./db');

var app = express();
app.use(cors());
app.use(bodyParser.json());

var DB = new Db();

var random = utils.random;

var BIG_DADDY = 'bigDaddy';
var SCOUT = 'scout';
var FLYER = 'flyer';
var vehicles = [BIG_DADDY, SCOUT, FLYER];

var center = [-95.081320, 29.564835];

app.get('/stats', function stats(req, res) {
  res.send(vehicles.reduce(function(p, c) {
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
  }, {}));
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

app.listen('3000');
