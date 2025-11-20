const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connection } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const fokontanyRoutes = require('./routes/fokontany');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fokontany', fokontanyRoutes);

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

// Route pour importer les fokontany
app.get('/api/init-fokontany', async (req, res) => {
  try {
    const FokontanyImporter = require('./scripts/importFokontany');
    const result = await FokontanyImporter.importFromGeoJSON();
    res.json({ 
      message: 'Fokontany de Toliara I importés avec succès',
      ...result
    });
  } catch (error) {
    console.error('Erreur initialisation fokontany:', error);
    res.status(500).json({ message: 'Erreur lors de l\'import des fokontany' });
  }
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 API disponible sur: http://localhost:${PORT}/api`);
  console.log(`🗄️  Initialisation BD: http://localhost:${PORT}/api/init-db`);
  console.log(`🗺️  Import fokontany: http://localhost:${PORT}/api/init-fokontany`);
  console.log(`📁 Dossier uploads: ${path.join(__dirname, 'uploads')}`);
});