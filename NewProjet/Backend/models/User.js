const { connection } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { immatricule, nom_complet, username, password, role } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO users (immatricule, nom_complet, username, password, role) 
        VALUES (?, ?, ?, ?, ?)
      `;
      connection.query(query, [immatricule, nom_complet, username, hashedPassword, role], (err, results) => {
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
      const query = 'SELECT id, immatricule, nom_complet, username, role, is_active, photo FROM users WHERE id = ?';
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
      const query = 'SELECT id, immatricule, nom_complet, username, role, is_active, created_at, photo FROM users';
      connection.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async update(id, userData) {
    const { nom_complet, username, role, is_active } = userData;
    
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE users 
        SET nom_complet = ?, username = ?, role = ?, is_active = ? 
        WHERE id = ?
      `;
      connection.query(query, [nom_complet, username, role, is_active, id], (err, results) => {
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