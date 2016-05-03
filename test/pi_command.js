var net = require('net');


createClient(133, 'bdfront');
createClient(121, 'bdright');
createClient(151, 'bdback');
createClient(142, 'bdleft');
createClient(201, 'arm');
createClient(200, 'scout');

function createClient(id, name) {
  var client = new net.Socket();
  client.connect(9000, 'localhost', function() {
    client.write('192.168.1.' + id + '~');
    client.on('data', function(data) {
      console.log(name + ':', data.toString());
    });
  });

}
