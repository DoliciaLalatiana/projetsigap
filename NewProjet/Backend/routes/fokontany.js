const express = require('express');
const router = express.Router();
const FokontanyController = require('../controllers/fokontanyController');
const auth = require('../middleware/auth');

router.get('/', auth, FokontanyController.getAllFokontany);
router.get('/region/:region', auth, FokontanyController.getFokontanyByRegion);
router.get('/user-location', auth, FokontanyController.getFokontanyByUserLocation);
router.get('/search', auth, FokontanyController.searchFokontany);
router.post('/create-test', auth, FokontanyController.createTestFokontany);
router.get('/me', auth, FokontanyController.getMyFokontany);

// GET /api/fokontany/me - return first fokontany row (adapt to your auth later)
router.get('/me', (req, res) => {
  connection.query('SELECT * FROM fokontany LIMIT 1', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erreur serveur' });
    if (!rows || rows.length === 0) return res.json({ nom: null });
    res.json(rows[0]);
  });
});

module.exports = router;