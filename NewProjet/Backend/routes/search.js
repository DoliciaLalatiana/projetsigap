const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const searchController = require('../controllers/searchController');

// Routes de recherche avancée
router.get('/', authMiddleware, searchController.searchAll);
router.get('/residences', authMiddleware, searchController.searchResidences);
router.get('/residents', authMiddleware, searchController.searchResidents);

module.exports = router;