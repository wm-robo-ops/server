#!/usr/bin/env node
var dataStreamServer = require('./data_stream_server');

var createDataStreamWebServer = dataStreamServer.createDataStreamWebServer;
var PiDataStreamServer = dataStreamServer.PiDataStreamServer;

var gpsDeviceDataStreamWebServers = {
  '192.168.1.133': createDataStreamWebServer({
    port: 4001,
    name: 'big_daddy_gps_data_stream'
  }),
  scout: createDataStreamWebServer({
    port: 4002,
    name: 'scout_data_gps_stream'
  }),
  flyer: createDataStreamWebServer({
    port: 4003,
    name: 'flyer_data_gps_stream'
  })
};

new PiDataStreamServer({ // eslint-disable-line no-unused-vars, no-new
  name: 'gps device',
  port: 4000,
  clients: gpsDeviceDataStreamWebServers
});

