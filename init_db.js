#!/usr/bin/env node

var sqlite3 = require('sqlite3');

var DB_NAME = 'robo-ops.db';

var db = new sqlite3.Database(DB_NAME);

db.run('CREATE TABLE rocks (id text not null, name integer primary key, lon real not null, lat real not null, color text not null)');
