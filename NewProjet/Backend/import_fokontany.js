/*
  Usage (PowerShell):
  cd "e:\Stage\projetsigap\NewProjet\Backend"
  npm install mysql2 dotenv
  # créer .env avec DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
  node import_fokontany.js
*/
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const mysql = require('mysql2/promise');

const JSON_PATH = path.join(__dirname, 'toliara-I-fokontany-exclusif.json');

function stripComments(raw) {
  return raw.replace(/\/\/.*$/mg, '');
}

function validFeature(f) {
  if (!f || f.type !== 'Feature') return false;
  const p = f.properties || {};
  if (!p.id && !p.shapeID && !p.name) return false;
  if (!f.geometry || !f.geometry.type) return false;
  // ensure coordinates exist and non-empty
  const c = f.geometry.coordinates;
  if (!Array.isArray(c)) return false;
  if (c.length === 0) return false;
  return true;
}

(async () => {
  const cfg = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sigap_db',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT,10) : 3306,
    multipleStatements: true
  };
  const conn = await mysql.createConnection(cfg);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS fokontany (
      id VARCHAR(128) PRIMARY KEY,
      name VARCHAR(255),
      shapeName VARCHAR(255),
      shapeID VARCHAR(128),
      shapeGroup VARCHAR(64),
      shapeType VARCHAR(64),
      properties JSON,
      geometry JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  let geo;
  try { geo = JSON.parse(raw); }
  catch (e) {
    const cleaned = stripComments(raw);
    geo = JSON.parse(cleaned);
  }
  if (!geo.features || !Array.isArray(geo.features)) {
    console.error('Fichier invalide : pas de features');
    process.exit(1);
  }

  const insertSql = `INSERT INTO fokontany
    (id,name,shapeName,shapeID,shapeGroup,shapeType,properties,geometry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name=VALUES(name), shapeName=VALUES(shapeName), shapeID=VALUES(shapeID),
      shapeGroup=VALUES(shapeGroup), shapeType=VALUES(shapeType),
      properties=VALUES(properties), geometry=VALUES(geometry);`;

  let n = 0;
  for (const f of geo.features) {
    if (!validFeature(f)) continue;
    const props = f.properties || {};
    const id = props.id || props.shapeID || props.name;
    const name = props.name || null;
    const shapeName = props.shapeName || null;
    const shapeID = props.shapeID || null;
    const shapeGroup = props.shapeGroup || null;
    const shapeType = props.shapeType || null;
    const propsJson = JSON.stringify(props);
    const geomJson = JSON.stringify(f.geometry || null);
    if (!id) continue;
    await conn.execute(insertSql, [id, name, shapeName, shapeID, shapeGroup, shapeType, propsJson, geomJson]);
    n++;
  }
  console.log('Import terminé:', n, 'features insérées/MAJ');
  await conn.end();
})();