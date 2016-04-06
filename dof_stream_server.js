#!/usr/bin/env node
var dataStreamServer = require('./data_stream_server');

var createDataStreamWebServer = dataStreamServer.createDataStreamWebServer;
var PiDataStreamServer = dataStreamServer.PiDataStreamServer;

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

new PiDataStreamServer({ // eslint-disable-line no-unused-vars, no-new
  name: 'dof device',
  port: 3000,
  clients: dofDeviceDataStreamWebServers
});
