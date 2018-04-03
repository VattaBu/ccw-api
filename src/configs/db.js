const mysql = require('mysql');

const db = mysql.createPool({
  host: 'localhost',
  // Change to mysql config
  user: 'root',
  // password: '',
  password: '1234',
  database: 'ccw',
});

module.exports = db;
