const express = require('express');
const router = express.Router();
const PersonController = require('../controllers/personController');

// GET /api/persons[?residence_id=]
router.get('/', PersonController.list);
// POST /api/persons
router.post('/', PersonController.create);
// PUT /api/persons/:id
router.put('/:id', PersonController.update);
// DELETE /api/persons/:id
router.delete('/:id', PersonController.remove);

module.exports = router;