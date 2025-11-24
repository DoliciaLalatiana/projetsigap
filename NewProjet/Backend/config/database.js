const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sigap',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  multipleStatements: false,
  charset: 'utf8mb4'
});

connection.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
  console.log('MySQL connected');
});

module.exports = { connection };