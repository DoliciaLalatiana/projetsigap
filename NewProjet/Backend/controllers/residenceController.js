const fs = require('fs');
const path = require('path');
const util = require('util');
const multer = require('multer'); // <-- ajouté
const { connection } = require('../config/database');
const NotificationController = require('./notificationController');

// Créer dossiers upload si manquants
const uploadsRoot = path.join(__dirname, '..', 'uploads');
const pendingDir = path.join(uploadsRoot, 'pending_residences');
const residencesDir = path.join(uploadsRoot, 'residences');
if (!fs.existsSync(pendingDir)) fs.mkdirSync(pendingDir, { recursive: true });
if (!fs.existsSync(residencesDir)) fs.mkdirSync(residencesDir, { recursive: true });

// Multer storage pour photos des residences (dest: uploads/residences)
const storageRes = multer.diskStorage({
  destination: (req, file, cb) => cb(null, residencesDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, unique);
  }
});
const upload = multer({ storage: storageRes });

// Multer storage pour pending (dest: uploads/pending_residences)
const storagePending = multer.diskStorage({
  destination: (req, file, cb) => cb(null, pendingDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, unique);
  }
});
const uploadPending = multer({ storage: storagePending });

const queryAsync = (sql, params=[]) => new Promise((resolve, reject) => {
  connection.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
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
      // Note: accepter JSON body OR multipart/form-data (avec fichiers uploadés via `uploadPending` middleware)
      const body = req.body || {};
      // If multipart, JSON fields may be strings; try to parse residents/photos if provided as JSON string
      const parseIfJson = (val) => {
        if (!val) return undefined;
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch { return undefined; }
        }
        return val;
      };

      const { lot, quartier, ville, fokontany, lat, lng, created_by } = body;
      let residents = parseIfJson(body.residents) || [];
      let photos = parseIfJson(body.photos) || [];
      const notes = body.notes || null;

      if (!lot || lat == null || lng == null) {
        return res.status(400).json({ error: 'lot, lat et lng requis' });
      }

      const user = req.user;

      // If files uploaded (multipart) and using uploadPending middleware, append filenames
      if (req.files && req.files.length > 0) {
        const uploaded = req.files.map(f => `/uploads/pending_residences/${f.filename}`);
        photos = photos.concat(uploaded);
      }

      // Compose residenceData and include residents/photos/notes if provided
      const residenceData = {
        lot, quartier, ville, fokontany, lat, lng, created_by: created_by || user.id,
        residents: Array.isArray(residents) ? residents : [],
        photos: Array.isArray(photos) ? photos : [],
        notes: notes || null
      };

      // Si c'est un agent, mettre en attente d'approbation
      if (user.role === 'agent') {

        // Sauvegarder dans pending_residences (inclut residents)
        const pendingQuery = `INSERT INTO pending_residences (residence_data, submitted_by, status, created_at) VALUES (?, ?, 'pending', NOW())`;
        
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
        // Pour secrétaire et admin, création directe (si des residents fournis, on les insère)
        const sql = `INSERT INTO residences (lot, quartier, ville, fokontany, lat, lng, created_by, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
        
        connection.query(sql, [lot, quartier || null, ville || null, fokontany || null, lat, lng, created_by || user.id], (err, result) => {
          if (err) {
            console.error('Erreur création résidence:', err);
            return res.status(500).json({ error: 'Erreur création' });
          }
          
          const id = result.insertId;

          // If residents were provided, insert them and relations
          const residentsToInsert = Array.isArray(residenceData.residents) ? residenceData.residents : [];
          const insertPersonAndRelation = (resident) => {
            return new Promise((resolve, reject) => {
              const personSql = `INSERT INTO persons (residence_id, nom_complet, date_naissance, cin, genre, telephone, created_at)
                                 VALUES (?, ?, ?, ?, ?, ?, NOW())`;
              connection.query(personSql, [id, resident.nomComplet, resident.dateNaissance || null, resident.cin || null, resident.genre || 'homme', resident.telephone || null], (err, r) => {
                if (err) return reject(err);
                const personId = r.insertId;
                const relSql = `INSERT INTO person_relations (person_id, relation_type, parent_id, is_proprietaire, famille_id) VALUES (?, ?, ?, ?, ?)`;
                const isProp = resident.statut_habitation === 'proprietaire' ? 1 : 0;
                connection.query(relSql, [personId, resident.lien_parente || null, resident.parent_id || null, isProp, resident.famille_id || null], (err2) => {
                  if (err2) return reject(err2);
                  resolve();
                });
              });
            });
          };

          Promise.all(residentsToInsert.map(r => insertPersonAndRelation(r)))
            .then(() => {
              connection.query('SELECT * FROM residences WHERE id = ?', [id], (e, rows) => {
                if (e) return res.status(201).json({ id });
                res.status(201).json(rows[0]);
              });
            })
            .catch(errIns => {
              console.error('Erreur insertion residents après création résidence directe:', errIns);
              // Note: do not rollback residence creation here (we already created it); return partial info
              res.status(201).json({ id, warning: 'Résidence créée mais erreur insertion résidents. Voir logs.' });
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
    const residenceId = req.params.id;            // <-- corrigé (avant: destructuring erroné)
    const photoId = req.params.photoId;           // <-- corrigé
    
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
    const pendingId = parseInt(req.params.pendingId, 10);
    const user = req.user;

    if (!pendingId) return res.status(400).json({ error: 'pendingId manquant' });

    try {
      // fetch pending
      const pendingRows = await queryAsync('SELECT * FROM pending_residences WHERE id = ?', [pendingId]);
      if (!pendingRows || pendingRows.length === 0) return res.status(404).json({ error: 'Pending non trouvé' });
      const pending = pendingRows[0];
      const residenceData = typeof pending.residence_data === 'string' ? JSON.parse(pending.residence_data) : pending.residence_data;

      // Authorization: only submitter or secretaire/admin can approve
      if (user.role === 'agent' && user.id !== pending.submitted_by) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      // begin transaction
      await new Promise((resolve, reject) => connection.beginTransaction(err => err ? reject(err) : resolve()));

      // insert residence
      const insertResidenceSql = `
        INSERT INTO residences (lot, quartier, ville, fokontany, lat, lng, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      const resInsert = await queryAsync(insertResidenceSql, [
        residenceData.lot || null,
        residenceData.quartier || null,
        residenceData.ville || null,
        residenceData.fokontany || null,
        residenceData.lat || null,
        residenceData.lng || null,
        user.id || residenceData.created_by || null
      ]);
      const residenceId = resInsert.insertId;

      // insert persons and relations (if any)
      const residents = Array.isArray(residenceData.residents) ? residenceData.residents : [];
      for (const r of residents) {
        const personRes = await queryAsync(
          `INSERT INTO persons (residence_id, nom_complet, date_naissance, cin, genre, telephone, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [residenceId, r.nom_complet || r.nomComplet || null, r.date_naissance || r.dateNaissance || null, r.cin || null, r.genre || r.sexe || 'homme', r.telephone || null]
        );
        const personId = personRes.insertId;

        // person_relations optional
        if (r.lien_parente || r.parent_id || r.famille_id || typeof r.statut_habitation !== 'undefined') {
          const isProp = (r.statut_habitation === 'proprietaire' || r.is_proprietaire) ? 1 : 0;
          await queryAsync(
            `INSERT INTO person_relations (person_id, relation_type, parent_id, is_proprietaire, famille_id, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [personId, r.lien_parente || r.relation_type || null, r.parent_id || null, isProp, r.famille_id || null]
          );
        }
      }

      // handle photos: move from pending folder to residences folder and insert rows into photos table
      const movedFilenames = [];
      try {
        const pendingPhotos = Array.isArray(residenceData.photos) ? residenceData.photos : [];
        const pendingDir = path.join(__dirname, '..', 'uploads', 'pending_residences');
        const residencesDir = path.join(__dirname, '..', 'uploads', 'residences');
        if (!fs.existsSync(residencesDir)) fs.mkdirSync(residencesDir, { recursive: true });

        for (const p of pendingPhotos) {
          const filename = (typeof p === 'string') ? p.split('/').pop() : null;
          if (!filename) continue;

          const pendingPath = path.join(pendingDir, filename);
          // if file exists in pending, move it; else if it already exists in residences, reuse
          if (fs.existsSync(pendingPath)) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const destFilename = `residence-${uniqueSuffix}${path.extname(filename)}`;
            const destPath = path.join(residencesDir, destFilename);

            // try rename, if cross-device error occurs fallback to copy+unlink
            try {
              fs.renameSync(pendingPath, destPath);
            } catch (renameErr) {
              // fallback: copy then unlink
              try {
                fs.copyFileSync(pendingPath, destPath);
                fs.unlinkSync(pendingPath);
              } catch (copyErr) {
                throw copyErr;
              }
            }
            movedFilenames.push(destFilename);
          } else {
            // check if file already in residences
            const possibleRes = path.join(residencesDir, filename);
            if (fs.existsSync(possibleRes)) {
              movedFilenames.push(filename);
            } else {
              // not found: ignore but warn
              console.warn('Photo pending non trouvée, ignorée:', filename);
            }
          }
        }

        if (movedFilenames.length > 0) {
          const values = movedFilenames.map(fn => [residenceId, fn]);
          await queryAsync('INSERT INTO photos (residence_id, filename) VALUES ?', [values]);
        }
      } catch (fileErr) {
        console.error('Erreur traitement fichiers photos:', fileErr);
        // cleanup moved files if any
        try {
          const residencesDir = path.join(__dirname, '..', 'uploads', 'residences');
          for (const fn of movedFilenames) {
            const pth = path.join(residencesDir, fn);
            if (fs.existsSync(pth)) fs.unlinkSync(pth);
          }
        } catch (cleanupErr) { /* ignore */ }

        await new Promise((resolve) => connection.rollback(() => resolve()));
        return res.status(500).json({ error: 'Erreur traitement photos' });
      }

      // update pending_residences status to approved
      await queryAsync(`UPDATE pending_residences SET status = 'approved', reviewed_by = ?, review_notes = ?, updated_at = NOW() WHERE id = ?`, [user.id, req.body.review_notes || null, pendingId]);

      // create notification to submitter
      try {
        await NotificationController.createNotification({
          type: 'residence_approval',
          title: 'Résidence approuvée',
          message: `Votre résidence (${residenceData.lot || 'sans lot'}) a été approuvée.`,
          recipient_id: pending.submitted_by,
          sender_id: user.id,
          related_entity_id: residenceId,
          status: 'approved'
        });
      } catch (notifErr) {
        console.warn('Impossible de créer notification:', notifErr);
      }

      // commit
      await new Promise((resolve, reject) => connection.commit(err => err ? reject(err) : resolve()));

      // return created residence
      const created = await queryAsync('SELECT * FROM residences WHERE id = ? LIMIT 1', [residenceId]);
      const resObj = created && created[0] ? created[0] : { id: residenceId };
      return res.json({ message: 'Résidence approuvée avec succès', residence: resObj, approved: true });

    } catch (err) {
      console.error('approveResidence error', err);
      try { await new Promise((resolve) => connection.rollback(() => resolve())); } catch (e) { /* ignore */ }
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // NOUVEAU : Rejeter une résidence en attente
  static async rejectResidence(req, res) {
    const pendingId = parseInt(req.params.pendingId, 10);
    const user = req.user;
    const review_notes = req.body.review_notes || null;

    if (!pendingId) return res.status(400).json({ error: 'pendingId manquant' });

    try {
      const rows = await queryAsync('SELECT * FROM pending_residences WHERE id = ?', [pendingId]);
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Pending non trouvé' });
      const pending = rows[0];
      // Authorization
      if (user.role === 'agent' && user.id !== pending.submitted_by) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      // update status to rejected
      await queryAsync(`UPDATE pending_residences SET status = 'rejected', reviewed_by = ?, review_notes = ?, updated_at = NOW() WHERE id = ?`, [user.id, review_notes, pendingId]);

      // optionally delete pending files to free space
      try {
        const residenceData = typeof pending.residence_data === 'string' ? JSON.parse(pending.residence_data) : pending.residence_data;
        const pendingPhotos = Array.isArray(residenceData.photos) ? residenceData.photos : [];
        const pendingDir = path.join(__dirname, '..', 'uploads', 'pending_residences');
        for (const p of pendingPhotos) {
          const filename = (typeof p === 'string') ? p.split('/').pop() : null;
          if (!filename) continue;
          const filePath = path.join(pendingDir, filename);
          try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { console.warn('Impossible de supprimer fichier pending:', filePath, e); }
        }
      } catch (e) {
        console.warn('Erreur suppression fichiers pending après rejet:', e);
      }

      // notify submitter
      try {
        await NotificationController.createNotification({
          type: 'residence_approval',
          title: 'Résidence rejetée',
          message: `Votre résidence a été rejetée. ${review_notes ? 'Motif: ' + review_notes : ''}`,
          recipient_id: pending.submitted_by,
          sender_id: user.id,
          related_entity_id: null,
          status: 'rejected'
        });
      } catch (notifErr) {
        console.warn('Impossible de créer notification rejet:', notifErr);
      }

      return res.json({ message: 'Pending rejeté avec succès', rejected: true });

    } catch (err) {
      console.error('rejectResidence error', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // Get detail of a pending residence by id (includes parsed data and photo urls)
  static async getPendingResidenceById(req, res) {
    try {
      const pendingId = parseInt(req.params.pendingId, 10);
      const user = req.user;
      if (!pendingId) return res.status(400).json({ error: 'pendingId manquant' });

      const rows = await queryAsync('SELECT * FROM pending_residences WHERE id = ?', [pendingId]);
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Pending non trouvé' });
      const pending = rows[0];

      // Authorization: submitter, secretaire/admin (secretaire limité au même fokontany maybe handled ailleurs)
      if (user.role === 'agent' && user.id !== pending.submitted_by) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      const residenceData = typeof pending.residence_data === 'string' ? JSON.parse(pending.residence_data) : pending.residence_data;

      // convert photo filenames to accessible URLs (point to pending uploads)
      const photos = Array.isArray(residenceData.photos) ? residenceData.photos.map(p => {
        const filename = (typeof p === 'string') ? p.split('/').pop() : null;
        return filename ? `/uploads/pending_residences/${filename}` : null;
      }).filter(Boolean) : [];

      // optionally fetch persons stored ailleurs - pending contains residents in JSON, so return them
      const result = {
        id: pending.id,
        status: pending.status,
        submitted_by: pending.submitted_by,
        reviewed_by: pending.reviewed_by,
        review_notes: pending.review_notes,
        created_at: pending.created_at,
        updated_at: pending.updated_at,
        residence_data: {
          ...residenceData,
          photos
        }
      };

      return res.json(result);
    } catch (error) {
      console.error('Erreur récupération pending:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // NOUVEAU : Upload photos pour une pending_residence après soumission
  // Utiliser middleware uploadPending.array('photos', 8)
  static async uploadPendingPhotos(req, res) {
    try {
      const { pendingId } = req.params;
      const user = req.user;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      // Récupérer pending
      connection.query('SELECT * FROM pending_residences WHERE id = ?', [pendingId], (err, results) => {
        if (err) {
          console.error('Erreur récupération pending:', err);
          // cleanup files
          req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
          return res.status(500).json({ error: 'Erreur serveur' });
        }
        if (!results.length) {
          // cleanup files
          req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
          return res.status(404).json({ error: 'Pending non trouvé' });
        }

        const pending = results[0];

        // Autorisation: seul le submitter peut ajouter photos, ou secretaire/admin
        if (user.role === 'agent' && user.id !== pending.submitted_by) {
          // cleanup files
          req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
          return res.status(403).json({ error: 'Accès non autorisé' });
        }

        // Parse existing data
        let data;
        try {
          data = JSON.parse(pending.residence_data);
        } catch (e) {
          // cleanup files
          req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
          console.error('JSON parse error pending data', e);
          return res.status(500).json({ error: 'Données pending corrompues' });
        }

        if (!Array.isArray(data.photos)) data.photos = [];

        const added = req.files.map(f => `/uploads/pending_residences/${f.filename}`);
        data.photos = data.photos.concat(added);

        // Update DB
        connection.query('UPDATE pending_residences SET residence_data = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(data), pendingId], (errU) => {
          if (errU) {
            console.error('Erreur update pending photos:', errU);
            // cleanup files
            req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
            return res.status(500).json({ error: 'Erreur enregistrement photos' });
          }

          res.status(201).json({
            message: 'Photos ajoutées au dossier en attente',
            photos: added
          });
        });
      });
    } catch (error) {
      console.error('Erreur uploadPendingPhotos:', error);
      // cleanup files
      if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = { ResidenceController, upload, uploadPending };
