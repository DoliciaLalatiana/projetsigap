const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const connection = require('../config/database.js'); // Assurez-vous que le chemin est correct

router.post('/', auth, authorize('admin'), UserController.createUser);
router.get('/', auth, authorize('admin'), UserController.getAllUsers);
router.put('/:id', auth, authorize('admin'), UserController.updateUser);
router.delete('/:id', auth, authorize('admin'), UserController.deleteUser);
router.patch('/:id/deactivate', auth, authorize('admin'), UserController.deactivateUser);

router.post('/users', auth, async (req, res) => {
  try {
    const given = (req.body.fokontanyCode || req.body.fokontany || '').trim();
    if (!given) return res.status(400).json({ error: 'Fokontany requis' });

    const conn = connection.promise ? connection.promise() : connection;

    // 1) chercher par code exact
    let [rows] = await conn.query('SELECT id, code, nom FROM fokontany WHERE code = ? LIMIT 1', [given]);

    // 2) si pas trouvé, chercher par nom exact (insensible à la casse)
    if (!rows.length) {
      [rows] = await conn.query('SELECT id, code, nom FROM fokontany WHERE LOWER(nom) = LOWER(?) LIMIT 1', [given]);
    }

    // 3) si toujours pas, chercher par LIKE (code ou nom) et retourner les correspondances
    if (!rows.length) {
      const like = `%${given}%`;
      const [matches] = await conn.query(
        'SELECT id, code, nom FROM fokontany WHERE code LIKE ? OR nom LIKE ? LIMIT 10',
        [like, like]
      );
      if (matches.length === 1) {
        rows = matches;
      } else if (matches.length > 1) {
        return res.status(300).json({ error: 'Plusieurs fokontany correspondent', matches });
      } else {
        return res.status(400).json({ error: `Fokontany introuvable: ${given}` });
      }
    }

    const fokontanyId = rows[0].id;

    // ...existing user creation logic ici (utiliser fokontanyId)...
    // Exemple minimal :
    // const userId = await createUser({ username: req.body.username, ..., fokontany_id: fokontanyId });
    // res.json({ success: true, userId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;