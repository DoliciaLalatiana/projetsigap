const express = require('express');
const router = express.Router();
const { ResidenceController, upload } = require('../controllers/residenceController');
const auth = require('../middleware/auth');

// GET /api/residences
router.get('/', ResidenceController.list);
// POST /api/residences
router.post('/', auth, ResidenceController.create);
// PUT /api/residences/:id
router.put('/:id', auth, ResidenceController.update);
// PATCH /api/residences/:id/deactivate (au lieu de DELETE)
router.patch('/:id/deactivate', auth, ResidenceController.deactivate);

// Routes pour la gestion des photos
router.post('/:id/photos', auth, upload.array('photos', 10), ResidenceController.uploadPhotos);
router.get('/:id/photos', ResidenceController.getPhotos);
router.delete('/:id/photos/:photoId', auth, ResidenceController.deletePhoto);

module.exports = router;