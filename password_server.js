#!/usr/bin/env node
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();

var PORT = 10000;

app.use(cors());
app.use(bodyParser.json());

app.post('/', function password(req, res) {
  console.log('WEB: Authentication');
  if (req.body.password === process.env.ROBO_OPS_PASSWORD) {
    res.send('ok');
  } else {
    res.send('incorrect password');
  }
});

app.listen(PORT, function() {
  console.log('WEB - authentication server port:', PORT);
});
