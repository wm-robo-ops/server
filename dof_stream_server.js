#!/usr/bin/env node
var dataStreamServer = require('./data_stream_server');
var dofDevices = require('./devices').dof;

var createDataStreamWebServer = dataStreamServer.createDataStreamWebServer;
var PiDataStreamServer = dataStreamServer.PiDataStreamServer;

var dofDeviceDataStreamWebServers = Object.keys(dofDevices).reduce(function(out, key) {
  var dof = dofDevices[key];
  out[dof.device] = createDataStreamWebServer({
    port: dof.port,
    name: key
  });
  return out;
}, {});

new PiDataStreamServer({ // eslint-disable-line no-unused-vars, no-new
  name: 'dof device',
  port: 3000,
  clients: dofDeviceDataStreamWebServers
});
