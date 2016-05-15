#!/usr/bin/env node
var net = require('net');
var devices = require('../devices');
var exec = require('child_process').exec;

var videos = [];

createClient(133, 'bdfront');
createClient(121, 'bdright');
createClient(151, 'bdback');
createClient(142, 'bdleft');
createClient(92, 'arm');
createClient(200, 'scout');

var pid;

function createClient(id, name) {
  var client = new net.Socket();
  client.connect(9000, 'localhost'/*'ec2-54-173-230-101.compute-1.amazonaws.com'*/, function() {
    client.write('192.168.1.' + id + '~');
    client.on('data', function(data) {
      console.log(name + ':', data.toString());
      var start = data.toString().split(':')[0] === 'START' ? true : false;
      var device = devices.cameras[name].device.split('.')[3];
      if (start) {
        videos.push(device);
      } else {
        videos = videos.filter(function(v) { return v !== device; } );
      }
      if (videos.length) {
        if (pid)
          exec('sudo kill ' + pid, function() {
	    startVideo(function(p) {
	      pid = p;
	      console.log(pid);
	    });
	  });
        else
	  startVideo(function(p) {
	    pid = p;
	    console.log(pid);
	  });
      }

    });
    client.on('error', function(e) {
      console.log(e);
    });
  });
}

function startVideo(cb) {
  var cmd = './video.sh | tee';
  var vid;
  for (var i = 0; i < videos.length; i++) {
    cmd += ' >(./pi_video.js ' + videos[i] + ')';
  }
  var child = exec(cmd);
  cb(child.pid);
}

