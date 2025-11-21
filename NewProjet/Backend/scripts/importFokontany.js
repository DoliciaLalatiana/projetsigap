const fs = require('fs');
const path = require('path');
const { connection } = require('../config/database');

async function importFromGeoJSON() {
  const filePath = path.join(__dirname, '..', 'toliara-I-fokontany-exclusif.json');
  if (!fs.existsSync(filePath)) throw new Error('Fichier JSON introuvable: ' + filePath);

  const raw = fs.readFileSync(filePath, 'utf8');
  const cleaned = raw.replace(/\/\/.*\n/g, ''); // enlever commentaires JS éventuels
  const geo = JSON.parse(cleaned);

  if (!geo.features || !Array.isArray(geo.features)) {
    throw new Error('Format GeoJSON invalide');
  }

  let inserted = 0;
  const skipped = [];

  for (const feat of geo.features) {
    const props = feat.properties || {};
    const geom = feat.geometry || {};
    const code = props.shapeName || props.name || props.shapeID || props.code || null;
    const nom = props.name || props.shapeName || 'Inconnu';
    const geometry_type = geom.type || null;
    let coords = geom.coordinates || null;

    let coordsString = null;
    let centre_lat = null;
    let centre_lng = null;

    try {
      if (coords && Array.isArray(coords)) {
        // Normaliser pour obtenir un anneau de points [ [lng,lat], ... ]
        let ring = null;
        if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
          // Polygon like: [ [ [lng,lat], ... ], ... ]
          ring = coords[0][0] || coords[0];
        } else if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
          // already a ring: [[lng,lat], ...]
          ring = coords;
        } else {
          // essayer d'aplatir et regrouper par paires numériques
          const nums = [];
          (function walk(a) {
            if (!Array.isArray(a)) return;
            for (const v of a) {
              if (Array.isArray(v)) walk(v);
              else if (typeof v === 'number') nums.push(v);
            }
          })(coords);
          const flat = [];
          for (let i = 0; i + 1 < nums.length; i += 2) flat.push([nums[i], nums[i + 1]]);
          if (flat.length) ring = flat;
        }

        if (ring && Array.isArray(ring) && ring.length > 0) {
          const normalized = [];
          let sumLat = 0, sumLng = 0, count = 0;
          for (const p of ring) {
            if (Array.isArray(p) && p.length >= 2) {
              const lng = parseFloat(p[0]);
              const lat = parseFloat(p[1]);
              if (!isNaN(lat) && !isNaN(lng)) {
                normalized.push([lng, lat]);
                sumLat += lat; sumLng += lng; count++;
              }
            }
          }
          if (normalized.length > 0) {
            // stocker comme polygon standard [ [ [lng,lat], ... ] ]
            coords = [[normalized]];
            coordsString = JSON.stringify(coords);
            centre_lat = count ? (sumLat / count) : null;
            centre_lng = count ? (sumLng / count) : null;
          } else {
            coords = null;
          }
        } else {
          coords = null;
        }
      } else {
        coords = null;
      }
    } catch (err) {
      console.warn('normalisation coords failed for', code, err);
      coords = null;
    }

    if (!code) {
      skipped.push({ reason: 'no_code', name: nom });
      continue;
    }

    const insertQuery = `
      INSERT INTO fokontany (code, nom, commune, district, region, geometry_type, coordinates, centre_lat, centre_lng, type, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE nom = VALUES(nom), commune = VALUES(commune), geometry_type = VALUES(geometry_type), coordinates = VALUES(coordinates), centre_lat = VALUES(centre_lat), centre_lng = VALUES(centre_lng), updated_at = CURRENT_TIMESTAMP
    `;
    const values = [
      code,
      nom,
      props.commune || null,
      props.district || null,
      geo.metadata?.region || props.region || 'Toliara I',
      geometry_type,
      coordsString,
      centre_lat,
      centre_lng,
      'fokontany',
      'imported'
    ];

    try {
      await new Promise((resolve, reject) => {
        connection.query(insertQuery, values, (err) => err ? reject(err) : resolve());
      });
      inserted++;
    } catch (err) {
      console.error('Erreur insert fokontany', code, err.message || err);
      skipped.push({ reason: 'db_error', code, error: err.message || String(err) });
    }
  }

  return { inserted, skipped };
}

module.exports = { importFromGeoJSON };