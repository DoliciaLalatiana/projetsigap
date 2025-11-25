const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { connection } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const residencesRoutes = require('./routes/residences');
const fokontanyRoutes = require('./routes/fokontany');
const personsRoutes = require('./routes/persons');
const { importFromGeoJSON } = require('./scripts/importFokontany');

const jwt = require('jsonwebtoken');
const util = require('util');
const multer = require('multer');
const fs = require('fs');

// IMPORT DU MIDDLEWARE AUTH
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ensure uploads/residences exists
const uploadsDir = path.join(__dirname, 'uploads', 'residences');
fs.mkdirSync(uploadsDir, { recursive: true });

// multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substr(2,6)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// ensure tables exist
function createFokontanyTable() {
  const q = `
    CREATE TABLE IF NOT EXISTS fokontany (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(255),
      nom VARCHAR(255),
      coordinates JSON,
      centre_lat DOUBLE,
      centre_lng DOUBLE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  connection.query(q, (err) => { if (err) console.error('createFokontanyTable', err); });
}

function createResidencesTable() {
  const q = `
    CREATE TABLE IF NOT EXISTS residences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lot VARCHAR(255) NOT NULL,
      quartier VARCHAR(255),
      ville VARCHAR(255),
      fokontany VARCHAR(255),
      lat DOUBLE,
      lng DOUBLE,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  connection.query(q, (err) => { if (err) console.error('createResidencesTable', err); });
}
createResidencesTable();

// créer la table persons (personnes vivant dans une résidence)
function createPersonsTable() {
  const q = `
    CREATE TABLE IF NOT EXISTS persons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      residence_id INT NOT NULL,
      nom_complet VARCHAR(255) NOT NULL,
      date_naissance DATE NULL,
      cin VARCHAR(50) NULL,
      genre ENUM('homme','femme','autre') DEFAULT 'homme',
      telephone VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  connection.query(q, (err) => { if (err) console.error('createPersonsTable', err); });
}
createPersonsTable();

// create photos table if missing
function createPhotosTable() {
  const q = `
    CREATE TABLE IF NOT EXISTS photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      residence_id INT NOT NULL,
      filename VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  connection.query(q, (err) => { if (err) console.error('createPhotosTable', err); });
}
createPhotosTable();

// NEW: create person_relations table if missing
function createPersonRelationsTable() {
  const q = `
    CREATE TABLE IF NOT EXISTS person_relations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      person_id INT NOT NULL,
      parent_id INT NULL,
      relation_type VARCHAR(191) NULL,
      is_proprietaire BOOLEAN DEFAULT FALSE,
      famille_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES persons(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  connection.query(q, (err) => { if (err) console.error('createPersonRelationsTable', err); else console.log('✅ Table person_relations créée ou déjà existante'); });
}
createPersonRelationsTable();

// NOUVELLES TABLES : notifications et pending_residences
function createNotificationsTable() {
  const q = `
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type ENUM('residence_approval', 'password_change', 'password_reset') NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      recipient_id INT NOT NULL,
      sender_id INT NULL,
      related_entity_id INT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  connection.query(q, (err) => { 
    if (err) console.error('createNotificationsTable', err);
    else console.log('✅ Table notifications créée ou déjà existante');
  });
}

function createPendingResidencesTable() {
  const q = `
    CREATE TABLE IF NOT EXISTS pending_residences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      residence_data JSON NOT NULL,
      submitted_by INT NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      reviewed_by INT NULL,
      review_notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  connection.query(q, (err) => { 
    if (err) console.error('createPendingResidencesTable', err);
    else console.log('✅ Table pending_residences créée ou déjà existante');
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/residences', residencesRoutes);
app.use('/api/fokontany', fokontanyRoutes);
app.use('/api/persons', personsRoutes);

// NOUVELLES ROUTES : Notifications (CORRIGÉ)
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const NotificationController = require('./controllers/notificationController');
    await NotificationController.getUserNotifications(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/notifications/unread-count', auth, async (req, res) => {
  try {
    const NotificationController = require('./controllers/notificationController');
    await NotificationController.getUnreadCount(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.patch('/api/notifications/:notificationId/read', auth, async (req, res) => {
  try {
    const NotificationController = require('./controllers/notificationController');
    await NotificationController.markAsRead(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// NOUVELLES ROUTES : Approbation des résidences (CORRIGÉ)
app.get('/api/residences/pending', auth, async (req, res) => {
  try {
    const { ResidenceController } = require('./controllers/residenceController');
    await ResidenceController.getPendingResidences(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/residences/pending/:pendingId/approve', auth, async (req, res) => {
  try {
    const { ResidenceController } = require('./controllers/residenceController');
    await ResidenceController.approveResidence(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/residences/pending/:pendingId/reject', auth, async (req, res) => {
  try {
    const { ResidenceController } = require('./controllers/residenceController');
    await ResidenceController.rejectResidence(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: '✅ API SIGAP fonctionnelle' });
});

// Route pour créer les tables automatiquement
app.get('/api/init-db', (req, res) => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      immatricule VARCHAR(50) UNIQUE NOT NULL,
      nom_complet VARCHAR(255) NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'agent', 'secretaire') DEFAULT 'agent',
      fokontany_id INT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      photo VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const createFokontanyTable = `
    CREATE TABLE IF NOT EXISTS fokontany (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      nom VARCHAR(255) NOT NULL,
      commune VARCHAR(255),
      district VARCHAR(255),
      region VARCHAR(255),
      geometry_type ENUM('Polygon', 'MultiPolygon') DEFAULT 'Polygon',
      coordinates JSON NOT NULL,
      centre_lat DECIMAL(10, 8),
      centre_lng DECIMAL(11, 8),
      type VARCHAR(50) DEFAULT 'fokontany',
      source VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const createPasswordResetTable = `
    CREATE TABLE IF NOT EXISTS password_reset_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      immatricule VARCHAR(50) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  const createPasswordChangeTable = `
    CREATE TABLE IF NOT EXISTS password_change_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      new_password_hash VARCHAR(255) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  connection.query(createUsersTable, (err) => {
    if (err) {
      console.error('Erreur création table users:', err);
      return res.status(500).json({ error: 'Erreur création table users' });
    }
    
    connection.query(createFokontanyTable, (err) => {
      if (err) {
        console.error('Erreur création table fokontany:', err);
        return res.status(500).json({ error: 'Erreur création table fokontany' });
      }
      
      connection.query(createPasswordResetTable, (err) => {
        if (err) {
          console.error('Erreur création table password_reset_requests:', err);
          return res.status(500).json({ error: 'Erreur création table password_reset_requests' });
        }

        connection.query(createPasswordChangeTable, (err) => {
          if (err) {
            console.error('Erreur création table password_change_requests:', err);
            return res.status(500).json({ error: 'Erreur création table password_change_requests' });
          }

          // Créer les nouvelles tables
          createNotificationsTable();
          createPendingResidencesTable();

          // Créer l'admin par défaut
          const bcrypt = require('bcryptjs');
          const defaultPassword = bcrypt.hashSync('admin1234', 10);
          
          const insertAdmin = `
            INSERT IGNORE INTO users (immatricule, nom_complet, username, password, role) 
            VALUES ('ADMIN001', 'Administrateur SIGAP', 'admin', ?, 'admin')
          `;

          connection.query(insertAdmin, [defaultPassword], (err) => {
            if (err) {
              console.error('Erreur création admin:', err);
              return res.status(500).json({ error: 'Erreur création admin' });
            }
            
            res.json({ 
              message: 'Base de données initialisée avec succès',
              admin: {
                username: 'admin',
                password: 'admin1234'
              }
            });
          });
        });
      });
    });
  });
});

// créer la table fokontany si manquante
function createFokontanyTable() {
  const q = `
    CREATE TABLE IF NOT EXISTS fokontany (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(191) NOT NULL UNIQUE,
      nom VARCHAR(255),
      commune VARCHAR(191),
      district VARCHAR(191),
      region VARCHAR(191),
      geometry_type VARCHAR(50),
      coordinates LONGTEXT,
      centre_lat DOUBLE,
      centre_lng DOUBLE,
      type VARCHAR(50),
      source VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  connection.query(q, (err) => { if (err) console.error('createFokontanyTable', err); });
}

// ajouter fokontany_id à users si absent
function ensureUsersFokontanyColumn() {
  const q = `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS fokontany_id INT NULL,
    ADD CONSTRAINT IF NOT EXISTS fk_users_fokontany FOREIGN KEY (fokontany_id) REFERENCES fokontany(id) ON DELETE SET NULL ON UPDATE CASCADE;
  `;
  // MySQL doesn't support IF NOT EXISTS for ALTER easily; run safe checks
  connection.query("SHOW COLUMNS FROM users LIKE 'fokontany_id'", (err, results) => {
    if (err) {
      console.error('check users columns', err);
      return;
    }
    if (!results || results.length === 0) {
      connection.query('ALTER TABLE users ADD COLUMN fokontany_id INT NULL', (err2) => {
        if (err2) console.error('add fokontany_id', err2);
        else {
          // add FK if fokontany table exists
          connection.query('ALTER TABLE users ADD CONSTRAINT fk_users_fokontany FOREIGN KEY (fokontany_id) REFERENCES fokontany(id) ON DELETE SET NULL ON UPDATE CASCADE', (err3) => {
            if (err3) console.warn('could not add fk_users_fokontany', err3.message || err3);
          });
        }
      });
    }
  });
}

// appeler au démarrage
createFokontanyTable();
ensureUsersFokontanyColumn();
createNotificationsTable();
createPendingResidencesTable();

// Route pour initialiser / importer les fokontany depuis le JSON
app.get('/api/init-fokontany', async (req, res) => {
  try {
    const result = await importFromGeoJSON();
    res.json({ success: true, result });
  } catch (err) {
    console.error('init-fokontany error', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// Retourne le fokontany associé à l'utilisateur connecté (Bearer token)
app.get('/api/fokontany/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token manquant' });
    const token = auth.slice(7);
    let payload;
    try {
      payload = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'cle_secrete');
    } catch (e) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    const userId = payload.id || payload.userId || payload.sub;
    if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié' });

    const q = `
      SELECT f.id, f.code, f.nom, f.commune, f.district, f.region, f.geometry_type,
             f.coordinates, f.centre_lat, f.centre_lng, f.type, f.source
      FROM users u
      LEFT JOIN fokontany f ON u.fokontany_id = f.id
      WHERE u.id = ? LIMIT 1;
    `;
    connection.query(q, [userId], (err, results) => {
      if (err) {
        console.error('fokontany/me db error', err);
        return res.status(500).json({ error: 'Erreur base de données' });
      }
      if (!results || results.length === 0 || !results[0].id) {
        return res.status(404).json({ error: 'Aucun fokontany associé' });
      }
      const f = results[0];
      try {
        if (typeof f.coordinates === 'string' && f.coordinates.trim() !== '') f.coordinates = JSON.parse(f.coordinates);
      } catch (e) { /* keep raw */ }
      res.json(f);
    });
  } catch (err) {
    console.error('fokontany/me error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Photo upload route: POST /api/residences/:id/photos
app.post('/api/residences/:id/photos', upload.single('photo'), (req, res) => {
  const residenceId = parseInt(req.params.id, 10);
  if (!req.file || !residenceId) return res.status(400).json({ error: 'Missing file or residence id' });
  const filename = req.file.filename;
  const q = 'INSERT INTO photos (residence_id, filename) VALUES (?, ?)';
  connection.query(q, [residenceId, filename], (err, result) => {
    if (err) {
      console.error('insert photo error', err);
      return res.status(500).json({ error: 'Erreur enregistrement photo' });
    }
    const insertedId = result.insertId;
    const fileUrl = `/uploads/residences/${filename}`; // serve static if needed
    // optional: return inserted record
    res.status(201).json({ id: insertedId, residence_id: residenceId, filename, url: fileUrl });
  });
});

// Add route to list residences with photos aggregated
app.get('/api/residences', (req, res) => {
  const q = 'SELECT r.*, p.id AS photo_id, p.filename FROM residences r LEFT JOIN photos p ON p.residence_id = r.id ORDER BY r.id DESC, p.id DESC';
  connection.query(q, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erreur DB residences' });
    // aggregate photos per residence
    const map = new Map();
    rows.forEach(r => {
      const id = r.id;
      if (!map.has(id)) {
        map.set(id, { ...r, photos: [] });
      }
      if (r.photo_id && r.filename) {
        const base = map.get(id);
        base.photos.push(`/uploads/residences/${r.filename}`);
      }
      // remove joined fields if present
      const base = map.get(id);
      delete base.photo_id;
      delete base.filename;
    });
    const list = Array.from(map.values());
    res.json(list);
  });
});

// Serve uploads statically (simple)
app.use('/uploads/residences', express.static(path.join(__dirname, 'uploads', 'residences')));

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 API disponible sur: http://localhost:${PORT}/api`);
  console.log(`🗄️  Initialisation BD: http://localhost:${PORT}/api/init-db`);
  console.log(`🗺️  Import fokontany: http://localhost:${PORT}/api/init-fokontany`);
  console.log(`📁 Dossier uploads: ${path.join(__dirname, 'uploads')}`);
  console.log(`🔔 Système de notifications activé`);
});