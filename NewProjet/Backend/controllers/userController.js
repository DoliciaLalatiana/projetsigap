const User = require('../models/User');
const { connection } = require('../config/database');

class UserController {
  static async createUser(req, res) {
    try {
      const { immatricule, nom_complet, role, fokontany_code } = req.body;

      if (!immatricule || !nom_complet || !role) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
      }

      const username = immatricule.toLowerCase();
      const password = Math.random().toString(36).slice(-8);

      let fokontany_id = null;
      if (fokontany_code) {
        const given = (fokontany_code || '').trim();
        if (!given) return res.status(400).json({ message: 'Fokontany requis' });

        const conn = connection.promise ? connection.promise() : connection;

        // 1) chercher par code exact
        let [rows] = await conn.query('SELECT id, code, nom FROM fokontany WHERE code = ? LIMIT 1', [given]);

        // 2) si pas trouvé, chercher par nom exact (insensible à la casse)
        if (!rows.length) {
          [rows] = await conn.query('SELECT id, code, nom FROM fokontany WHERE LOWER(nom) = LOWER(?) LIMIT 1', [given]);
        }

        // 3) si toujours pas, chercher par LIKE (code ou nom)
        if (!rows.length) {
          const like = `%${given}%`;
          const [matches] = await conn.query(
            'SELECT id, code, nom FROM fokontany WHERE code LIKE ? OR nom LIKE ? LIMIT 10',
            [like, like]
          );
          if (matches.length === 1) {
            rows = matches;
          } else if (matches.length > 1) {
            return res.status(400).json({ message: 'Plusieurs fokontany correspondent', matches });
          } else {
            return res.status(400).json({ message: `Fokontany introuvable: ${given}` });
          }
        }

        fokontany_id = rows[0].id;
      }

      const userData = {
        immatricule,
        nom_complet,
        username,
        password,
        role,
        fokontany_id
      };

      await User.create(userData);

      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        user: {
          username,
          password,
          nom_complet,
          role,
          fokontany_code: fokontany_code || null
        }
      });
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Immatricule ou username déjà utilisé' });
      }
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const users = await User.getAll();
      res.json(users);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;

      await User.update(id, userData);
      res.json({ message: 'Utilisateur mis à jour avec succès' });
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await User.delete(id);
      res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  static async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      await User.update(id, { is_active: false });
      res.json({ message: 'Utilisateur désactivé avec succès' });
    } catch (error) {
      console.error('Erreur désactivation utilisateur:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}

module.exports = UserController;