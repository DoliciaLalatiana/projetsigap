const { connection } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const NotificationController = require('./notificationController');

// Configuration multer pour l'upload des photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/residences');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'residence-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées!'), false);
    }
  }
});

class ResidenceController {
  static list(req, res) {
    const fok = req.query.fokontany;
    const sql = fok
      ? `SELECT r.*, 
                GROUP_CONCAT(CONCAT('/uploads/residences/', p.filename)) as photos,
                COUNT(DISTINCT p.id) as photo_count
         FROM residences r 
         LEFT JOIN photos p ON p.residence_id = r.id 
         WHERE r.fokontany = ? 
         GROUP BY r.id
         ORDER BY r.id DESC`
      : `SELECT r.*, 
                GROUP_CONCAT(CONCAT('/uploads/residences/', p.filename)) as photos,
                COUNT(DISTINCT p.id) as photo_count
         FROM residences r 
         LEFT JOIN photos p ON p.residence_id = r.id 
         GROUP BY r.id
         ORDER BY r.id DESC`;
    
    connection.query(sql, fok ? [fok] : [], (err, results) => {
      if (err) {
        console.error('Erreur récupération résidences:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      // Transformer les résultats pour avoir un tableau de photos
      const residences = results.map(residence => ({
        ...residence,
        photos: residence.photos ? residence.photos.split(',').filter(photo => photo.trim() !== '') : []
      }));

      res.json(residences);
    });
  }

  // MODIFIÉ : Créer une résidence avec système d'approbation
  static async create(req, res) {
    try {
      const { lot, quartier, ville, fokontany, lat, lng, created_by } = req.body;
      if (!lot || lat == null || lng == null) {
        return res.status(400).json({ error: 'lot, lat et lng requis' });
      }

      const user = req.user;

      // Si c'est un agent, mettre en attente d'approbation
      if (user.role === 'agent') {
        const residenceData = {
          lot, quartier, ville, fokontany, lat, lng, created_by: user.id
        };

        // Sauvegarder dans pending_residences
        const pendingQuery = `INSERT INTO pending_residences (residence_data, submitted_by, status) VALUES (?, ?, 'pending')`;
        
        connection.query(pendingQuery, [JSON.stringify(residenceData), user.id], async (err, result) => {
          if (err) {
            console.error('Erreur création résidence en attente:', err);
            return res.status(500).json({ error: 'Erreur création' });
          }

          const pendingId = result.insertId;

          try {
            // Trouver les secrétaires du même fokontany
            const secretariesQuery = `
              SELECT id, nom_complet 
              FROM users 
              WHERE role = 'secretaire' 
              AND fokontany_id = ? 
              AND is_active = TRUE
            `;
            
            connection.query(secretariesQuery, [user.fokontany_id], async (err, secretaries) => {
              if (err) {
                console.error('Erreur recherche secrétaires:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
              }

              // Créer des notifications pour chaque secrétaire
              for (const secretary of secretaries) {
                await NotificationController.createNotification({
                  type: 'residence_approval',
                  title: 'Nouvelle résidence à approuver',
                  message: `L'agent ${user.nom_complet} a ajouté une nouvelle résidence (${lot}) qui nécessite votre approbation.`,
                  recipient_id: secretary.id,
                  sender_id: user.id,
                  related_entity_id: pendingId,
                  status: 'pending'
                });
              }

              res.status(201).json({
                message: 'Résidence soumise pour approbation. Attendez la confirmation du secrétaire.',
                requires_approval: true,
                pending_id: pendingId
              });
            });
          } catch (notificationError) {
            console.error('Erreur création notification:', notificationError);
            res.status(201).json({
              message: 'Résidence soumise pour approbation.',
              requires_approval: true,
              pending_id: pendingId
            });
          }
        });
      } else {
        // Pour secrétaire et admin, création directe
        const sql = `INSERT INTO residences (lot, quartier, ville, fokontany, lat, lng, created_by, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
        
        connection.query(sql, [lot, quartier || null, ville || null, fokontany || null, lat, lng, created_by || user.id], (err, result) => {
          if (err) {
            console.error('Erreur création résidence:', err);
            return res.status(500).json({ error: 'Erreur création' });
          }
          
          const id = result.insertId;
          connection.query('SELECT * FROM residences WHERE id = ?', [id], (e, rows) => {
            if (e) return res.status(201).json({ id });
            res.status(201).json(rows[0]);
          });
        });
      }
    } catch (error) {
      console.error('Erreur création résidence:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  static update(req, res) {
    const id = req.params.id;
    const { lot, quartier, ville } = req.body;
    
    const sql = `UPDATE residences SET lot = ?, quartier = ?, ville = ? WHERE id = ?`;
    connection.query(sql, [lot, quartier || null, ville || null, id], (err) => {
      if (err) {
        console.error('Erreur mise à jour résidence:', err);
        return res.status(500).json({ error: 'Erreur mise à jour' });
      }
      
      connection.query('SELECT * FROM residences WHERE id = ?', [id], (e, rows) => {
        if (e) return res.status(200).end();
        res.json(rows[0]);
      });
    });
  }

  // NE PAS SUPPRIMER - Désactiver au lieu de supprimer
  static deactivate(req, res) {
    const id = req.params.id;
    const sql = `UPDATE residences SET is_active = FALSE WHERE id = ?`;
    connection.query(sql, [id], (err) => {
      if (err) {
        console.error('Erreur désactivation résidence:', err);
        return res.status(500).json({ error: 'Erreur désactivation' });
      }
      res.json({ message: 'Résidence désactivée avec succès' });
    });
  }

  // Upload de photos pour une résidence
  static uploadPhotos(req, res) {
    const residenceId = req.params.id;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    const photos = req.files.map(file => ({
      residence_id: residenceId,
      filename: file.filename
    }));

    // Insérer les photos dans la base de données
    const query = 'INSERT INTO photos (residence_id, filename) VALUES ?';
    const values = photos.map(photo => [photo.residence_id, photo.filename]);
    
    connection.query(query, [values], (err, result) => {
      if (err) {
        console.error('Erreur insertion photos:', err);
        // Supprimer les fichiers uploadés en cas d'erreur
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
        return res.status(500).json({ error: 'Erreur enregistrement photos' });
      }

      // Retourner les URLs des photos
      const photoUrls = photos.map(photo => ({
        url: `/uploads/residences/${photo.filename}`,
        filename: photo.filename
      }));

      res.status(201).json({
        message: 'Photos uploadées avec succès',
        photos: photoUrls
      });
    });
  }

  // Récupérer les photos d'une résidence
  static getPhotos(req, res) {
    const residenceId = req.params.id;
    
    const query = `
      SELECT id, filename, created_at 
      FROM photos 
      WHERE residence_id = ? 
      ORDER BY created_at DESC
    `;
    
    connection.query(query, [residenceId], (err, results) => {
      if (err) {
        console.error('Erreur récupération photos:', err);
        return res.status(500).json({ error: 'Erreur récupération photos' });
      }

      const photos = results.map(photo => ({
        ...photo,
        url: `/uploads/residences/${photo.filename}`
      }));

      res.json(photos);
    });
  }

  // Supprimer une photo spécifique
  static deletePhoto(req, res) {
    const { residenceId, photoId } = req.params;
    
    // Récupérer le nom du fichier avant suppression
    const getQuery = 'SELECT filename FROM photos WHERE id = ? AND residence_id = ?';
    connection.query(getQuery, [photoId, residenceId], (err, results) => {
      if (err) {
        console.error('Erreur récupération photo:', err);
        return res.status(500).json({ error: 'Erreur récupération photo' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Photo non trouvée' });
      }

      const filename = results[0].filename;
      const filePath = path.join(__dirname, '../uploads/residences', filename);

      // Supprimer de la base de données
      const deleteQuery = 'DELETE FROM photos WHERE id = ? AND residence_id = ?';
      connection.query(deleteQuery, [photoId, residenceId], (err) => {
        if (err) {
          console.error('Erreur suppression photo DB:', err);
          return res.status(500).json({ error: 'Erreur suppression photo' });
        }

        // Supprimer le fichier physique
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Erreur suppression fichier:', unlinkErr);
          }
          
          res.json({ message: 'Photo supprimée avec succès' });
        });
      });
    });
  }

  // NOUVEAU : Récupérer les résidences en attente d'approbation
  static async getPendingResidences(req, res) {
    try {
      const user = req.user;
      
      // Seuls les secrétaires et admin peuvent voir les résidences en attente
      if (!['secretaire', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      let query = `
        SELECT pr.*, 
               u.nom_complet as submitter_name,
               u.immatricule as submitter_immatricule,
               f.nom as fokontany_nom
        FROM pending_residences pr
        JOIN users u ON pr.submitted_by = u.id
        LEFT JOIN fokontany f ON u.fokontany_id = f.id
        WHERE pr.status = 'pending'
      `;

      // Pour les secrétaires, seulement celles de leur fokontany
      if (user.role === 'secretaire') {
        query += ' AND u.fokontany_id = ?';
      }

      query += ' ORDER BY pr.created_at DESC';

      connection.query(query, user.role === 'secretaire' ? [user.fokontany_id] : [], (err, results) => {
        if (err) {
          console.error('Erreur récupération résidences en attente:', err);
          return res.status(500).json({ error: 'Erreur serveur' });
        }

        // Parser les données JSON
        const pendingResidences = results.map(row => ({
          ...row,
          residence_data: JSON.parse(row.residence_data)
        }));

        res.json(pendingResidences);
      });
    } catch (error) {
      console.error('Erreur get pending residences:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // NOUVEAU : Approuver une résidence en attente
  static async approveResidence(req, res) {
    try {
      const { pendingId } = req.params;
      const { review_notes } = req.body;
      const user = req.user;

      if (!['secretaire', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      // Récupérer la résidence en attente
      const getQuery = 'SELECT * FROM pending_residences WHERE id = ? AND status = "pending"';
      
      connection.query(getQuery, [pendingId], async (err, results) => {
        if (err) {
          console.error('Erreur récupération résidence en attente:', err);
          return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'Résidence en attente non trouvée' });
        }

        const pendingResidence = results[0];
        const residenceData = JSON.parse(pendingResidence.residence_data);

        connection.beginTransaction(async (err) => {
          if (err) {
            return res.status(500).json({ error: 'Erreur transaction' });
          }

          try {
            // Insérer dans la table residences
            const insertQuery = `
              INSERT INTO residences (lot, quartier, ville, fokontany, lat, lng, created_by, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            
            connection.query(insertQuery, [
              residenceData.lot,
              residenceData.quartier,
              residenceData.ville,
              residenceData.fokontany,
              residenceData.lat,
              residenceData.lng,
              residenceData.created_by
            ], async (err, result) => {
              if (err) {
                connection.rollback(() => {
                  res.status(500).json({ error: 'Erreur création résidence' });
                });
                return;
              }

              const residenceId = result.insertId;

              // Mettre à jour le statut de la résidence en attente
              const updatePendingQuery = `
                UPDATE pending_residences 
                SET status = 'approved', reviewed_by = ?, review_notes = ?, updated_at = NOW()
                WHERE id = ?
              `;
              
              connection.query(updatePendingQuery, [user.id, review_notes || null, pendingId], async (err) => {
                if (err) {
                  connection.rollback(() => {
                    res.status(500).json({ error: 'Erreur mise à jour statut' });
                  });
                  return;
                }

                // Créer une notification pour l'agent
                await NotificationController.createNotification({
                  type: 'residence_approval',
                  title: 'Résidence approuvée',
                  message: `Votre résidence (${residenceData.lot}) a été approuvée par le secrétaire.`,
                  recipient_id: pendingResidence.submitted_by,
                  sender_id: user.id,
                  related_entity_id: residenceId,
                  status: 'approved'
                });

                connection.commit(async (err) => {
                  if (err) {
                    connection.rollback(() => {
                      res.status(500).json({ error: 'Erreur commit' });
                    });
                    return;
                  }

                  // Récupérer la résidence créée
                  connection.query('SELECT * FROM residences WHERE id = ?', [residenceId], (e, rows) => {
                    if (e) return res.json({ id: residenceId, approved: true });
                    
                    res.json({
                      message: 'Résidence approuvée avec succès',
                      residence: rows[0],
                      approved: true
                    });
                  });
                });
              });
            });
          } catch (error) {
            connection.rollback(() => {
              res.status(500).json({ error: 'Erreur transaction' });
            });
          }
        });
      });
    } catch (error) {
      console.error('Erreur approbation résidence:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // NOUVEAU : Rejeter une résidence en attente
  static async rejectResidence(req, res) {
    try {
      const { pendingId } = req.params;
      const { review_notes } = req.body;
      const user = req.user;

      if (!['secretaire', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      const query = `
        UPDATE pending_residences 
        SET status = 'rejected', reviewed_by = ?, review_notes = ?, updated_at = NOW()
        WHERE id = ? AND status = 'pending'
      `;
      
      connection.query(query, [user.id, review_notes || null, pendingId], async (err, result) => {
        if (err) {
          console.error('Erreur rejet résidence:', err);
          return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Résidence en attente non trouvée' });
        }

        // Récupérer les infos pour la notification
        const getQuery = 'SELECT * FROM pending_residences WHERE id = ?';
        connection.query(getQuery, [pendingId], async (err, results) => {
          if (err) {
            console.error('Erreur récupération infos résidence:', err);
            return res.json({ message: 'Résidence rejetée' });
          }

          const pendingResidence = results[0];
          const residenceData = JSON.parse(pendingResidence.residence_data);

          // Créer une notification pour l'agent
          await NotificationController.createNotification({
            type: 'residence_approval',
            title: 'Résidence rejetée',
            message: `Votre résidence (${residenceData.lot}) a été rejetée par le secrétaire.${review_notes ? ` Raison: ${review_notes}` : ''}`,
            recipient_id: pendingResidence.submitted_by,
            sender_id: user.id,
            related_entity_id: pendingId,
            status: 'rejected'
          });

          res.json({ message: 'Résidence rejetée avec succès' });
        });
      });
    } catch (error) {
      console.error('Erreur rejet résidence:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = { ResidenceController, upload };