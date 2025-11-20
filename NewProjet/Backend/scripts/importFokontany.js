const { connection } = require('../config/database');
const fs = require('fs');
const path = require('path');

class FokontanyImporter {
  static async importFromGeoJSON() {
    try {
      const geoDataPath = path.join(__dirname, '../toliara-I-fokontany-exclusif.json');
      
      if (!fs.existsSync(geoDataPath)) {
        throw new Error('Fichier toliara-I-fokontany-exclusif.json non trouvé');
      }
      
      const geoData = JSON.parse(fs.readFileSync(geoDataPath, 'utf8'));
      
      console.log(`Import de ${geoData.features.length} fokontany...`);
      
      let importedCount = 0;
      let errorCount = 0;

      for (const feature of geoData.features) {
        try {
          const { properties, geometry } = feature;
          
          // Calcul du centre du polygon
          const centre = this.calculatePolygonCenter(geometry.coordinates);
          
          const fokontanyData = {
            code: properties.shapeID || properties.id,
            nom: properties.name,
            commune: 'Toliara I',
            district: 'Toliara I',
            region: 'Atsimo-Andrefana',
            geometry_type: geometry.type,
            coordinates: JSON.stringify(geometry.coordinates),
            centre_lat: centre.lat,
            centre_lng: centre.lng,
            type: 'fokontany',
            source: 'toliara-I-fokontany-exclusif.json'
          };

          await this.insertFokontany(fokontanyData);
          importedCount++;
          
        } catch (error) {
          console.error(`Erreur import fokontany ${properties.name}:`, error.message);
          errorCount++;
        }
      }
      
      console.log(`✅ Import terminé: ${importedCount} succès, ${errorCount} erreurs`);
      return { imported: importedCount, errors: errorCount };
      
    } catch (error) {
      console.error('Erreur import géodonnées:', error);
      throw error;
    }
  }

  static calculatePolygonCenter(coordinates) {
    try {
      // Pour un Polygon, coordinates[0] contient les points extérieurs
      const points = coordinates[0];
      let sumLat = 0;
      let sumLng = 0;
      
      for (const point of points) {
        sumLng += point[0];
        sumLat += point[1];
      }
      
      return {
        lat: sumLat / points.length,
        lng: sumLng / points.length
      };
    } catch (error) {
      // Retourner un centre par défaut de Toliara en cas d'erreur
      return { lat: -23.35, lng: 43.67 };
    }
  }

  static insertFokontany(fokontanyData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO fokontany (code, nom, commune, district, region, geometry_type, coordinates, centre_lat, centre_lng, type, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nom = VALUES(nom),
          coordinates = VALUES(coordinates),
          centre_lat = VALUES(centre_lat),
          centre_lng = VALUES(centre_lng),
          updated_at = CURRENT_TIMESTAMP
      `;
      
      connection.query(query, [
        fokontanyData.code,
        fokontanyData.nom,
        fokontanyData.commune,
        fokontanyData.district,
        fokontanyData.region,
        fokontanyData.geometry_type,
        fokontanyData.coordinates,
        fokontanyData.centre_lat,
        fokontanyData.centre_lng,
        fokontanyData.type,
        fokontanyData.source
      ], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async getFokontanyByName(nom) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM fokontany WHERE nom = ?';
      connection.query(query, [nom], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  static async getAllFokontanyNames() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, nom FROM fokontany ORDER BY nom';
      connection.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async getFokontanyById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM fokontany WHERE id = ?';
      connection.query(query, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  FokontanyImporter.importFromGeoJSON()
    .then(result => {
      console.log('Import terminé:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Erreur import:', error);
      process.exit(1);
    });
}

module.exports = FokontanyImporter;