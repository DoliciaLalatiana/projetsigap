const { connection } = require('../config/database');

class NotificationController {
  // Récupérer les notifications pour un utilisateur
  static async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT n.*, 
               u_sender.nom_complet as sender_name,
               u_sender.role as sender_role
        FROM notifications n
        LEFT JOIN users u_sender ON n.sender_id = u_sender.id
        WHERE n.recipient_id = ?
        ORDER BY n.created_at DESC
        LIMIT 50
      `;
      
      connection.query(query, [userId], (err, results) => {
        if (err) {
          console.error('Erreur récupération notifications:', err);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        
        res.json(results);
      });
    } catch (error) {
      console.error('Erreur get notifications:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Marquer une notification comme lue
  static async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;
      
      const query = 'UPDATE notifications SET is_read = TRUE WHERE id = ? AND recipient_id = ?';
      
      connection.query(query, [notificationId, userId], (err, result) => {
        if (err) {
          console.error('Erreur marquer notification lue:', err);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        
        res.json({ message: 'Notification marquée comme lue' });
      });
    } catch (error) {
      console.error('Erreur mark as read:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Compter les notifications non lues
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      
      const query = 'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = FALSE';
      
      connection.query(query, [userId], (err, results) => {
        if (err) {
          console.error('Erreur comptage notifications:', err);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        
        res.json({ unreadCount: results[0].count });
      });
    } catch (error) {
      console.error('Erreur unread count:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Créer une notification
  static async createNotification(notificationData) {
    return new Promise((resolve, reject) => {
      const { type, title, message, recipient_id, sender_id, related_entity_id, status } = notificationData;
      
      const query = `
        INSERT INTO notifications (type, title, message, recipient_id, sender_id, related_entity_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      connection.query(query, [type, title, message, recipient_id, sender_id || null, related_entity_id || null, status || 'pending'], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

module.exports = NotificationController;