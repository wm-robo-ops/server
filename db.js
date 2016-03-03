var sqlite3 = require('sqlite3');

var DB_NAME = 'robo_ops';

function DB() {
  this.db = new sqlite3.Database(DB_NAME);
}

DB.prototype.addRock = function(data, cb) {
  this.db.run('INSERT into rocks VALUES (' + ')', function(e) {
    if (e) cb(e);
    else cb(null);
  });
};

DB.prototype.removeROck = function(id, cb) {
  this.db.run('DELETE from rocks WHERE id = ' + id, function(e) {
    if (e) cb(e);
    else cb(null);
  });
};
