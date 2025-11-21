const fs = require('fs');
const path = require('path');
require('dotenv').config();
const mysql = require('mysql2/promise');

const JSON_PATH = path.join(__dirname, 'toliara-I-fokontany-exclusif.json');

function stripComments(raw) {
  return raw.replace(/\/\/.*$/mg, '');
}

function computeCentroid(geom) {
  if (!geom || !geom.coordinates) return null;
  let coords = geom.coordinates;
  // Handle MultiPolygon -> use first polygon/ring
  if (geom.type === 'MultiPolygon' && Array.isArray(coords) && coords[0]) coords = coords[0];
  // For Polygon, coords[0] is outer ring
  const ring = Array.isArray(coords[0]) ? coords[0] : coords;
  let sumX = 0, sumY = 0, count = 0;
  for (const p of ring) {
    if (!Array.isArray(p) || p.length < 2) continue;
    const lng = parseFloat(p[0]), lat = parseFloat(p[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    sumX += lng; sumY += lat; count++;
  }
  if (count === 0) return null;
  return { lat: sumY / count, lng: sumX / count };
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

  let raw = fs.readFileSync(JSON_PATH, 'utf8');
  let geo;
  try { geo = JSON.parse(raw); }
  catch (e) { geo = JSON.parse(stripComments(raw)); }

  if (!geo.features || !Array.isArray(geo.features)) {
    console.error('Fichier invalide : pas de features'); await conn.end(); process.exit(1);
  }

  try {
    // disable foreign keys temporarily, clear table, reset auto_increment
    await conn.query('SET FOREIGN_KEY_CHECKS = 0; TRUNCATE TABLE `fokontany`; SET FOREIGN_KEY_CHECKS = 1;');

    const insertSql = `
      INSERT INTO fokontany
        (code, nom, commune, district, region, geometry_type, coordinates, centre_lat, centre_lng, type, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        nom = VALUES(nom),
        commune = VALUES(commune),
        district = VALUES(district),
        region = VALUES(region),
        geometry_type = VALUES(geometry_type),
        coordinates = VALUES(coordinates),
        centre_lat = VALUES(centre_lat),
        centre_lng = VALUES(centre_lng),
        type = VALUES(type),
        source = VALUES(source),
        updated_at = CURRENT_TIMESTAMP;
    `;

    let inserted = 0, skipped = 0;
    for (let i = 0; i < geo.features.length; i++) {
      const f = geo.features[i];
      if (!f || f.type !== 'Feature') { skipped++; continue; }
      const props = f.properties || {};
      const code = String(props.shapeID || props.id || props.shapeName || props.name || `auto_${i}`);
      const nom = props.name || props.shapeName || null;
      const region = geo.metadata?.region || props.region || null;
      // ensure commune is never null (DB requires non-null) — fallback to props.commune_name, region or empty string
      const commune = props.commune || props.commune_name || region || '';
      const district = props.district || props.district_name || '';
       const geometry_type = f.geometry?.type || null;
       const coordsString = f.geometry ? JSON.stringify(f.geometry.coordinates) : null;
       const centre = computeCentroid(f.geometry || {});
      const centre_lat = centre?.lat ?? (props.centre_lat ? parseFloat(props.centre_lat) : null);
      const centre_lng = centre?.lng ?? (props.centre_lng ? parseFloat(props.centre_lng) : null);
       const type = 'fokontany';
       const source = geo.metadata?.source || path.basename(JSON_PATH);

      try {
        await conn.execute(insertSql, [code, nom, commune, district, region, geometry_type, coordsString, centre_lat, centre_lng, type, source]);
        inserted++;
      } catch (err) {
        console.warn('Insertion échouée index', i, err.message);
        skipped++;
      }
    }

    console.log(`Opération terminée. ${inserted} insérés/MAJ, ${skipped} ignorés.`);
  } catch (err) {
    console.error('Erreur durant l\'opération :', err.message);
  } finally {
    await conn.end();
  }
})();