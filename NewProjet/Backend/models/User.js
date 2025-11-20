const { connection } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { immatricule, nom_complet, username, password, role, fokontany_id } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO users (immatricule, nom_complet, username, password, role, fokontany_id) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      connection.query(query, [immatricule, nom_complet, username, hashedPassword, role, fokontany_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async findByUsername(username) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE username = ? AND is_active = TRUE';
      connection.query(query, [username], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  static async findByUsernameWithFokontany(username) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.*, f.nom as fokontany_nom, f.coordinates as fokontany_coordinates, 
               f.centre_lat as fokontany_centre_lat, f.centre_lng as fokontany_centre_lng
        FROM users u 
        LEFT JOIN fokontany f ON u.fokontany_id = f.id 
        WHERE u.username = ? AND u.is_active = TRUE
      `;
      connection.query(query, [username], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  static async findByImmatricule(immatricule) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE immatricule = ? AND is_active = TRUE';
      connection.query(query, [immatricule], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, immatricule, nom_complet, username, role, is_active, photo, fokontany_id FROM users WHERE id = ?';
      connection.query(query, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  static async findByIdWithFokontany(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.*, f.nom as fokontany_nom, f.coordinates as fokontany_coordinates,
               f.centre_lat as fokontany_centre_lat, f.centre_lng as fokontany_centre_lng
        FROM users u 
        LEFT JOIN fokontany f ON u.fokontany_id = f.id 
        WHERE u.id = ?
      `;
      connection.query(query, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  // Nouvelle méthode pour récupérer avec le mot de passe (pour vérification)
  static async findByIdWithPassword(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE id = ?';
      connection.query(query, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  static async getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.id, u.immatricule, u.nom_complet, u.username, u.role, u.is_active, 
               u.created_at, u.photo, u.fokontany_id, f.nom as fokontany_nom
        FROM users u 
        LEFT JOIN fokontany f ON u.fokontany_id = f.id
        ORDER BY u.nom_complet
      `;
      connection.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async update(id, userData) {
    const { nom_complet, username, role, is_active, fokontany_id } = userData;
    
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE users 
        SET nom_complet = ?, username = ?, role = ?, is_active = ?, fokontany_id = ? 
        WHERE id = ?
      `;
      connection.query(query, [nom_complet, username, role, is_active, fokontany_id, id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    return new Promise((resolve, reject) => {
      const query = 'UPDATE users SET password = ? WHERE id = ?';
      connection.query(query, [hashedPassword, id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM users WHERE id = ?';
      connection.query(query, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;