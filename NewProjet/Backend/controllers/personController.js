const { connection } = require('../config/database');

class PersonController {
  static list(req, res) {
    const residenceId = req.query.residence_id;
    const sql = residenceId
      ? `SELECT p.*, 
                pr.relation_type,
                pr.parent_id,
                pr.is_proprietaire,
                pr.famille_id
         FROM persons p
         LEFT JOIN person_relations pr ON p.id = pr.person_id
         WHERE p.residence_id = ? 
         ORDER BY p.id DESC`
      : `SELECT p.*, 
                pr.relation_type,
                pr.parent_id,
                pr.is_proprietaire,
                pr.famille_id
         FROM persons p
         LEFT JOIN person_relations pr ON p.id = pr.person_id
         ORDER BY p.id DESC`;
    
    connection.query(sql, residenceId ? [residenceId] : [], (err, results) => {
      if (err) {
        console.error('Erreur récupération personnes:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      res.json(results);
    });
  }

  static create(req, res) {
    const { 
      residence_id, 
      nom_complet, 
      date_naissance, 
      cin, 
      genre, 
      telephone,
      relation_type,
      parent_id,
      is_proprietaire,
      famille_id
    } = req.body;
    
    if (!residence_id || !nom_complet) {
      return res.status(400).json({ error: 'residence_id et nom_complet requis' });
    }

    connection.beginTransaction(err => {
      if (err) return res.status(500).json({ error: 'Erreur transaction' });

      // Insérer la personne
      const personSql = `INSERT INTO persons (residence_id, nom_complet, date_naissance, cin, genre, telephone, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, NOW())`;
      
      connection.query(personSql, [residence_id, nom_complet, date_naissance || null, cin || null, genre || null, telephone || null], (err, result) => {
        if (err) {
          connection.rollback(() => {
            res.status(500).json({ error: 'Erreur création personne' });
          });
          return;
        }

        const personId = result.insertId;

        // Insérer les relations si fournies
        if (relation_type || is_proprietaire !== undefined) {
          const relationSql = `INSERT INTO person_relations (person_id, relation_type, parent_id, is_proprietaire, famille_id)
                               VALUES (?, ?, ?, ?, ?)`;
          
          connection.query(relationSql, [personId, relation_type || null, parent_id || null, is_proprietaire || false, famille_id || null], (err) => {
            if (err) {
              connection.rollback(() => {
                res.status(500).json({ error: 'Erreur création relation' });
              });
              return;
            }

            connection.commit(err => {
              if (err) {
                connection.rollback(() => {
                  res.status(500).json({ error: 'Erreur commit' });
                });
                return;
              }

              // Récupérer la personne créée avec ses relations
              const getSql = `
                SELECT p.*, pr.relation_type, pr.parent_id, pr.is_proprietaire, pr.famille_id
                FROM persons p
                LEFT JOIN person_relations pr ON p.id = pr.person_id
                WHERE p.id = ?
              `;
              
              connection.query(getSql, [personId], (e, rows) => {
                if (e) return res.status(201).json({ id: personId });
                res.status(201).json(rows[0]);
              });
            });
          });
        } else {
          connection.commit(err => {
            if (err) {
              connection.rollback(() => {
                res.status(500).json({ error: 'Erreur commit' });
              });
              return;
            }

            connection.query('SELECT * FROM persons WHERE id = ?', [personId], (e, rows) => {
              if (e) return res.status(201).json({ id: personId });
              res.status(201).json(rows[0]);
            });
          });
        }
      });
    });
  }

  static update(req, res) {
    const id = req.params.id;
    const { nom_complet, date_naissance, cin, genre, telephone } = req.body;
    
    const sql = `UPDATE persons SET nom_complet = ?, date_naissance = ?, cin = ?, genre = ?, telephone = ? WHERE id = ?`;
    
    connection.query(sql, [nom_complet, date_naissance || null, cin || null, genre || null, telephone || null, id], (err) => {
      if (err) {
        console.error('Erreur mise à jour personne:', err);
        return res.status(500).json({ error: 'Erreur mise à jour' });
      }
      
      connection.query('SELECT * FROM persons WHERE id = ?', [id], (e, rows) => {
        if (e) return res.status(200).end();
        res.json(rows[0]);
      });
    });
  }

  static remove(req, res) {
    const id = req.params.id;
    
    connection.query('DELETE FROM persons WHERE id = ?', [id], (err) => {
      if (err) {
        console.error('Erreur suppression personne:', err);
        return res.status(500).json({ error: 'Erreur suppression' });
      }
      res.status(204).end();
    });
  }
}

module.exports = PersonController;