var sqlite3 = require('sqlite3');

var DB_NAME = 'robo-ops.db';

function DB() {
  this.db = new sqlite3.Database(DB_NAME);
}

DB.prototype.getRocks = function(cb) {
  this.db.all('SELECT * from rocks', function(e, data) {
    if (e) return cb(e);
    cb(null, data);
  });
};

DB.prototype.addRock = function(data, cb) {
  var cmd = 'INSERT into rocks VALUES (' +
      '\'' + data.id + '\', ' +
      ' ' + data.lon + ', ' +
      ' ' + data.lat + ', ' +
      '\'' + data.color + '\'' +
      ')';
  this.db.run(cmd, function(e) {
    if (e) return cb(e);
    cb(null);
  });
};

DB.prototype.removeRock = function(id, cb) {
  this.db.run('DELETE from rocks WHERE id = ' + id, function(e) {
    if (e) return cb(e);
    cb(null);
  });
};

module.exports = DB;
