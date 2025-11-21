const { connection } = require('../config/database');

class FokontanyController {
  static async getAllFokontany(req, res) {
    try {
      const query = `
        SELECT id, code, nom, commune, district, region, 
               geometry_type, coordinates, centre_lat, centre_lng,
               type, source
        FROM fokontany 
        ORDER BY region, district, commune, nom
      `;
      
      connection.query(query, (err, results) => {
        if (err) {
          console.error('Erreur récupération fokontany:', err);
          return res.status(500).json({ message: 'Erreur serveur' });
        }

        const fokontany = results.map(fkt => ({
          ...fkt,
          coordinates: JSON.parse(fkt.coordinates)
        }));

        res.json(fokontany);
      });
    } catch (error) {
      console.error('Erreur get fokontany:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getFokontanyByRegion(req, res) {
    try {
      const { region } = req.params;
      
      const query = `
        SELECT id, code, nom, commune, district, region, 
               geometry_type, coordinates, centre_lat, centre_lng,
               type, source
        FROM fokontany 
        WHERE region = ? 
        ORDER BY district, commune, nom
      `;
      
      connection.query(query, [region], (err, results) => {
        if (err) {
          console.error('Erreur récupération fokontany par région:', err);
          return res.status(500).json({ message: 'Erreur serveur' });
        }

        const fokontany = results.map(fkt => ({
          ...fkt,
          coordinates: JSON.parse(fkt.coordinates)
        }));

        res.json(fokontany);
      });
    } catch (error) {
      console.error('Erreur get fokontany par région:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getFokontanyByUserLocation(req, res) {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude et longitude requises' });
      }
  
      console.log('Recherche fokontany pour:', lat, lng);
  
      // Recherche par proximité du centre
      const query = `
        SELECT id, code, nom, commune, district, region, 
               geometry_type, coordinates, centre_lat, centre_lng,
               type, source,
               SQRT(POW(centre_lat - ?, 2) + POW(centre_lng - ?, 2)) as distance
        FROM fokontany 
        WHERE centre_lat IS NOT NULL AND centre_lng IS NOT NULL
        ORDER BY distance
        LIMIT 1
      `;
      
      connection.query(query, [parseFloat(lat), parseFloat(lng)], (err, results) => {
        if (err) {
          console.error('Erreur recherche fokontany:', err);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        
        if (results.length > 0) {
          const fokontany = {
            ...results[0],
            coordinates: JSON.parse(results[0].coordinates)
          };
          console.log('Fokontany trouvé:', fokontany.nom);
          res.json(fokontany);
        } else {
          console.log('Aucun fokontany trouvé dans la base de données');
          res.status(404).json({ message: 'Aucun fokontany trouvé' });
        }
      });
  
    } catch (error) {
      console.error('Erreur recherche fokontany par position:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async searchFokontany(req, res) {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: 'Terme de recherche requis' });
      }

      const searchQuery = `
        SELECT id, code, nom, commune, district, region, 
               geometry_type, coordinates, centre_lat, centre_lng,
               type, source
        FROM fokontany 
        WHERE nom LIKE ? OR commune LIKE ? OR district LIKE ?
        ORDER BY region, district, commune, nom
        LIMIT 20
      `;
      
      const searchTerm = `%${query}%`;
      
      connection.query(searchQuery, [searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) {
          console.error('Erreur recherche fokontany:', err);
          return res.status(500).json({ message: 'Erreur serveur' });
        }

        const fokontany = results.map(fkt => ({
          ...fkt,
          coordinates: JSON.parse(fkt.coordinates)
        }));

        res.json(fokontany);
      });
    } catch (error) {
      console.error('Erreur recherche fokontany:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Méthode pour créer des fokontany de test
  static async createTestFokontany(req, res) {
    try {
      // Vérifier d'abord si des données existent déjà
      const checkQuery = 'SELECT COUNT(*) as count FROM fokontany';
      
      connection.query(checkQuery, async (err, results) => {
        if (err) {
          console.error('Erreur vérification données:', err);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
  
        if (results[0].count > 0) {
          return res.json({ message: 'Données déjà existantes', count: results[0].count });
        }
  
        // Créer des fokontany de test autour d'Antananarivo
        const testFokontany = [
          {
            code: 'ANALAKELY_001',
            nom: 'Analakely',
            commune: 'Antananarivo Renivohitra',
            district: 'Antananarivo Renivohitra',
            region: 'Analamanga',
            geometry_type: 'Polygon',
            coordinates: JSON.stringify([[
              [47.520, -18.910],
              [47.530, -18.910],
              [47.530, -18.900],
              [47.520, -18.900],
              [47.520, -18.910]
            ]]),
            centre_lat: -18.905,
            centre_lng: 47.525,
            type: 'fokontany',
            source: 'test'
          },
          {
            code: 'ISORAKA_001',
            nom: 'Isoraka',
            commune: 'Antananarivo Renivohitra',
            district: 'Antananarivo Renivohitra',
            region: 'Analamanga',
            geometry_type: 'Polygon',
            coordinates: JSON.stringify([[
              [47.525, -18.905],
              [47.535, -18.905],
              [47.535, -18.895],
              [47.525, -18.895],
              [47.525, -18.905]
            ]]),
            centre_lat: -18.900,
            centre_lng: 47.530,
            type: 'fokontany',
            source: 'test'
          },
          {
            code: 'ANOSY_001',
            nom: 'Anosy',
            commune: 'Antananarivo Renivohitra',
            district: 'Antananarivo Renivohitra',
            region: 'Analamanga',
            geometry_type: 'Polygon',
            coordinates: JSON.stringify([[
              [47.515, -18.920],
              [47.525, -18.920],
              [47.525, -18.910],
              [47.515, -18.910],
              [47.515, -18.920]
            ]]),
            centre_lat: -18.915,
            centre_lng: 47.520,
            type: 'fokontany',
            source: 'test'
          },
          {
            code: 'ANDRAHARO_001',
            nom: 'Andraharo',
            commune: 'Antananarivo Renivohitra',
            district: 'Antananarivo Renivohitra',
            region: 'Analamanga',
            geometry_type: 'Polygon',
            coordinates: JSON.stringify([[
              [47.535, -18.915],
              [47.545, -18.915],
              [47.545, -18.905],
              [47.535, -18.905],
              [47.535, -18.915]
            ]]),
            centre_lat: -18.910,
            centre_lng: 47.540,
            type: 'fokontany',
            source: 'test'
          },
          {
            code: 'TSIMBAZAZA_001',
            nom: 'Tsimbazaza',
            commune: 'Antananarivo Renivohitra',
            district: 'Antananarivo Renivohitra',
            region: 'Analamanga',
            geometry_type: 'Polygon',
            coordinates: JSON.stringify([[
              [47.525, -18.925],
              [47.535, -18.925],
              [47.535, -18.915],
              [47.525, -18.915],
              [47.525, -18.925]
            ]]),
            centre_lat: -18.920,
            centre_lng: 47.530,
            type: 'fokontany',
            source: 'test'
          }
        ];
  
        let createdCount = 0;
  
        for (const fkt of testFokontany) {
          const query = `
            INSERT INTO fokontany (code, nom, commune, district, region, geometry_type, coordinates, centre_lat, centre_lng, type, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
  
          try {
            await new Promise((resolve, reject) => {
              connection.query(query, [
                fkt.code,
                fkt.nom,
                fkt.commune,
                fkt.district,
                fkt.region,
                fkt.geometry_type,
                fkt.coordinates,
                fkt.centre_lat,
                fkt.centre_lng,
                fkt.type,
                fkt.source
              ], (err, results) => {
                if (err) {
                  if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`Fokontany ${fkt.code} existe déjà`);
                    resolve(); // Ignorer les doublons
                  } else {
                    reject(err);
                  }
                } else {
                  createdCount++;
                  resolve(results);
                }
              });
            });
          } catch (error) {
            console.error(`Erreur création ${fkt.code}:`, error);
          }
        }
  
        res.json({ 
          message: 'Fokontany de test créés avec succès',
          created: createdCount,
          total: testFokontany.length
        });
      });
  
    } catch (error) {
      console.error('Erreur création fokontany test:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getMyFokontany(req, res) {
    try {
      const user = req.user;
      if (!user || !user.fokontany_id) {
        return res.status(404).json({ message: 'Aucun fokontany associé à cet utilisateur' });
      }

      const query = `
        SELECT id, code, nom, commune, district, region,
               geometry_type, coordinates, centre_lat, centre_lng,
               type, source
        FROM fokontany
        WHERE id = ?
        LIMIT 1
      `;

      connection.query(query, [user.fokontany_id], (err, results) => {
        if (err) {
          console.error('Erreur récupération fokontany utilisateur:', err);
          return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (!results || results.length === 0) {
          return res.status(404).json({ message: 'Fokontany introuvable' });
        }

        const f = results[0];
        try {
          f.coordinates = JSON.parse(f.coordinates);
        } catch (e) {}
        res.json(f);
      });
    } catch (error) {
      console.error('Erreur getMyFokontany:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}

module.exports = FokontanyController;