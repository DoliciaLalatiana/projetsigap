const connection = require('../config/database');

exports.searchAll = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const userId = req.user.id;
    
    if (!q || q.trim() === '') {
      return res.json([]);
    }
    
    const searchTerm = q.trim();
    
    // Récupérer le rôle et fokontany de l'utilisateur
    const userQuery = 'SELECT role, fokontany_id FROM users WHERE id = ?';
    connection.query(userQuery, [userId], async (userErr, userResults) => {
      if (userErr) {
        console.error('Erreur récupération utilisateur:', userErr);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      if (userResults.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      const user = userResults[0];
      const userRole = user.role;
      const fokontanyId = user.fokontany_id;
      
      // Construire la condition WHERE pour le fokontany
      let fokontanyCondition = '';
      let queryParams = [];
      
      if (userRole !== 'admin' && fokontanyId) {
        fokontanyCondition = 'AND r.fokontany_id = ?';
        queryParams.push(fokontanyId);
      }
      
      let results = [];
      
      switch (type) {
        case 'residence':
          // Recherche des résidences par lot, quartier ou ville
          const residenceQuery = `
            SELECT 
              r.id,
              r.lot,
              r.quartier,
              r.ville,
              r.lat,
              r.lng,
              r.fokontany_id,
              f.nom as fokontany_nom,
              u.nom_complet as created_by_name
            FROM residences r
            LEFT JOIN fokontany f ON r.fokontany_id = f.id
            LEFT JOIN users u ON r.created_by = u.id
            WHERE (
              r.lot LIKE ? OR 
              r.quartier LIKE ? OR 
              r.ville LIKE ?
            )
            ${fokontanyCondition}
            ORDER BY r.lot
            LIMIT 20
          `;
          
          const likeTerm = `%${searchTerm}%`;
          const residenceParams = fokontanyId ? [likeTerm, likeTerm, likeTerm, fokontanyId] : [likeTerm, likeTerm, likeTerm];
          
          connection.query(residenceQuery, residenceParams, (resErr, residences) => {
            if (resErr) {
              console.error('Erreur recherche résidences:', resErr);
              return res.status(500).json({ error: 'Erreur serveur' });
            }
            
            // Pour chaque résidence, récupérer les propriétaires et résidents
            const formattedResidences = residences.map(residence => ({
              type: 'residence',
              id: residence.id,
              lot: residence.lot,
              quartier: residence.quartier,
              ville: residence.ville,
              lat: residence.lat,
              lng: residence.lng,
              fokontany: residence.fokontany_nom,
              created_by: residence.created_by_name
            }));
            
            res.json(formattedResidences);
          });
          break;
          
        case 'resident':
          // Recherche des personnes par nom, prénom ou CIN
          const personQuery = `
            SELECT 
              p.id,
              p.nom_complet,
              p.date_naissance,
              p.cin,
              p.genre,
              p.telephone,
              p.residence_id,
              r.lot as residence_lot,
              r.quartier as residence_quartier,
              r.ville as residence_ville,
              r.fokontany_id,
              f.nom as fokontany_nom
            FROM persons p
            LEFT JOIN residences r ON p.residence_id = r.id
            LEFT JOIN fokontany f ON r.fokontany_id = f.id
            WHERE (
              p.nom_complet LIKE ? OR 
              p.cin LIKE ?
            )
            ${fokontanyCondition}
            ORDER BY p.nom_complet
            LIMIT 20
          `;
          
          const personParams = fokontanyId ? [`%${searchTerm}%`, `%${searchTerm}%`, fokontanyId] : [`%${searchTerm}%`, `%${searchTerm}%`];
          
          connection.query(personQuery, personParams, (personErr, persons) => {
            if (personErr) {
              console.error('Erreur recherche personnes:', personErr);
              return res.status(500).json({ error: 'Erreur serveur' });
            }
            
            const formattedPersons = persons.map(person => ({
              type: 'person',
              id: person.id,
              nom_complet: person.nom_complet,
              date_naissance: person.date_naissance,
              cin: person.cin,
              genre: person.genre,
              telephone: person.telephone,
              residence: {
                id: person.residence_id,
                lot: person.residence_lot,
                quartier: person.residence_quartier,
                ville: person.residence_ville,
                fokontany: person.fokontany_nom
              }
            }));
            
            res.json(formattedPersons);
          });
          break;
          
        default:
          // Recherche combinée (tous)
          const combinedResidenceQuery = `
            SELECT 
              r.id,
              r.lot,
              r.quartier,
              r.ville,
              'residence' as type
            FROM residences r
            WHERE (
              r.lot LIKE ? OR 
              r.quartier LIKE ? OR 
              r.ville LIKE ?
            )
            ${fokontanyCondition}
            LIMIT 10
          `;
          
          const combinedPersonQuery = `
            SELECT 
              p.id,
              p.nom_complet,
              'person' as type
            FROM persons p
            LEFT JOIN residences r ON p.residence_id = r.id
            WHERE (
              p.nom_complet LIKE ? OR 
              p.cin LIKE ?
            )
            ${fokontanyCondition}
            LIMIT 10
          `;
          
          const combinedParams = fokontanyId ? [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, fokontanyId] : [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
          const combinedPersonParams = fokontanyId ? [`%${searchTerm}%`, `%${searchTerm}%`, fokontanyId] : [`%${searchTerm}%`, `%${searchTerm}%`];
          
          // Exécuter les deux requêtes en parallèle
          connection.query(combinedResidenceQuery, combinedParams, (resErr, residences) => {
            if (resErr) {
              console.error('Erreur recherche résidences combinée:', resErr);
              return res.status(500).json({ error: 'Erreur serveur' });
            }
            
            connection.query(combinedPersonQuery, combinedPersonParams, (personErr, persons) => {
              if (personErr) {
                console.error('Erreur recherche personnes combinée:', personErr);
                return res.status(500).json({ error: 'Erreur serveur' });
              }
              
              const formattedResults = [];
              
              // Ajouter les résidences
              residences.forEach(residence => {
                formattedResults.push({
                  type: 'residence',
                  id: residence.id,
                  lot: residence.lot,
                  quartier: residence.quartier,
                  ville: residence.ville
                });
              });
              
              // Ajouter les personnes
              persons.forEach(person => {
                formattedResults.push({
                  type: 'person',
                  id: person.id,
                  nom_complet: person.nom_complet
                });
              });
              
              res.json(formattedResults);
            });
          });
          break;
      }
    });
    
  } catch (error) {
    console.error('Erreur recherche générale:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Recherche avancée de résidences
exports.searchResidencesAdvanced = async (req, res) => {
  try {
    const { lot, quartier, ville, fokontany } = req.query;
    const userId = req.user.id;
    
    // Récupérer le rôle et fokontany de l'utilisateur
    const userQuery = 'SELECT role, fokontany_id FROM users WHERE id = ?';
    connection.query(userQuery, [userId], (userErr, userResults) => {
      if (userErr) {
        console.error('Erreur récupération utilisateur:', userErr);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      if (userResults.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      const user = userResults[0];
      const userRole = user.role;
      const userFokontanyId = user.fokontany_id;
      
      // Construire la requête dynamiquement
      let conditions = [];
      let params = [];
      
      if (lot) {
        conditions.push('r.lot LIKE ?');
        params.push(`%${lot}%`);
      }
      
      if (quartier) {
        conditions.push('r.quartier LIKE ?');
        params.push(`%${quartier}%`);
      }
      
      if (ville) {
        conditions.push('r.ville LIKE ?');
        params.push(`%${ville}%`);
      }
      
      if (fokontany) {
        conditions.push('f.nom LIKE ?');
        params.push(`%${fokontany}%`);
      }
      
      // Ajouter la condition de fokontany pour les non-admins
      if (userRole !== 'admin' && userFokontanyId) {
        conditions.push('r.fokontany_id = ?');
        params.push(userFokontanyId);
      }
      
      // Si aucun critère, retourner vide
      if (conditions.length === 0) {
        return res.json([]);
      }
      
      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
      
      const query = `
        SELECT 
          r.id,
          r.lot,
          r.quartier,
          r.ville,
          r.lat,
          r.lng,
          r.created_at,
          f.nom as fokontany_nom,
          u.nom_complet as created_by_name,
          (SELECT COUNT(*) FROM persons p WHERE p.residence_id = r.id) as nb_residents
        FROM residences r
        LEFT JOIN fokontany f ON r.fokontany_id = f.id
        LEFT JOIN users u ON r.created_by = u.id
        ${whereClause}
        ORDER BY r.lot
        LIMIT 50
      `;
      
      connection.query(query, params, (err, results) => {
        if (err) {
          console.error('Erreur recherche résidences avancée:', err);
          return res.status(500).json({ error: 'Erreur serveur' });
        }
        
        res.json(results);
      });
    });
    
  } catch (error) {
    console.error('Erreur recherche résidences avancée:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Recherche avancée de personnes
exports.searchPersonsAdvanced = async (req, res) => {
  try {
    const { nom, cin, telephone, residence_lot } = req.query;
    const userId = req.user.id;
    
    // Récupérer le rôle et fokontany de l'utilisateur
    const userQuery = 'SELECT role, fokontany_id FROM users WHERE id = ?';
    connection.query(userQuery, [userId], (userErr, userResults) => {
      if (userErr) {
        console.error('Erreur récupération utilisateur:', userErr);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      if (userResults.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      const user = userResults[0];
      const userRole = user.role;
      const userFokontanyId = user.fokontany_id;
      
      // Construire la requête dynamiquement
      let conditions = [];
      let params = [];
      
      if (nom) {
        conditions.push('p.nom_complet LIKE ?');
        params.push(`%${nom}%`);
      }
      
      if (cin) {
        conditions.push('p.cin LIKE ?');
        params.push(`%${cin}%`);
      }
      
      if (telephone) {
        conditions.push('p.telephone LIKE ?');
        params.push(`%${telephone}%`);
      }
      
      if (residence_lot) {
        conditions.push('r.lot LIKE ?');
        params.push(`%${residence_lot}%`);
      }
      
      // Ajouter la condition de fokontany pour les non-admins
      if (userRole !== 'admin' && userFokontanyId) {
        conditions.push('r.fokontany_id = ?');
        params.push(userFokontanyId);
      }
      
      // Si aucun critère, retourner vide
      if (conditions.length === 0) {
        return res.json([]);
      }
      
      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
      
      const query = `
        SELECT 
          p.id,
          p.nom_complet,
          p.date_naissance,
          p.cin,
          p.genre,
          p.telephone,
          p.created_at,
          r.id as residence_id,
          r.lot as residence_lot,
          r.quartier as residence_quartier,
          r.ville as residence_ville,
          f.nom as fokontany_nom
        FROM persons p
        LEFT JOIN residences r ON p.residence_id = r.id
        LEFT JOIN fokontany f ON r.fokontany_id = f.id
        ${whereClause}
        ORDER BY p.nom_complet
        LIMIT 50
      `;
      
      connection.query(query, params, (err, results) => {
        if (err) {
          console.error('Erreur recherche personnes avancée:', err);
          return res.status(500).json({ error: 'Erreur serveur' });
        }
        
        res.json(results);
      });
    });
    
  } catch (error) {
    console.error('Erreur recherche personnes avancée:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Recherche rapide par lot
exports.searchByLot = async (req, res) => {
  try {
    const { lot } = req.query;
    const userId = req.user.id;
    
    if (!lot) {
      return res.json([]);
    }
    
    const userQuery = 'SELECT role, fokontany_id FROM users WHERE id = ?';
    connection.query(userQuery, [userId], (userErr, userResults) => {
      if (userErr) {
        console.error('Erreur récupération utilisateur:', userErr);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      const user = userResults[0];
      const userRole = user.role;
      const userFokontanyId = user.fokontany_id;
      
      let fokontanyCondition = '';
      let params = [`%${lot}%`];
      
      if (userRole !== 'admin' && userFokontanyId) {
        fokontanyCondition = 'AND r.fokontany_id = ?';
        params.push(userFokontanyId);
      }
      
      const query = `
        SELECT 
          r.id,
          r.lot,
          r.quartier,
          r.ville,
          r.lat,
          r.lng,
          f.nom as fokontany_nom,
          COUNT(p.id) as nb_residents
        FROM residences r
        LEFT JOIN fokontany f ON r.fokontany_id = f.id
        LEFT JOIN persons p ON p.residence_id = r.id
        WHERE r.lot LIKE ?
        ${fokontanyCondition}
        GROUP BY r.id
        ORDER BY r.lot
        LIMIT 20
      `;
      
      connection.query(query, params, (err, results) => {
        if (err) {
          console.error('Erreur recherche par lot:', err);
          return res.status(500).json({ error: 'Erreur serveur' });
        }
        
        res.json(results);
      });
    });
    
  } catch (error) {
    console.error('Erreur recherche par lot:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};