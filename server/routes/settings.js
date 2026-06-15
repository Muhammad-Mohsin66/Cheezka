const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

router.get('/public', settingsController.getPublicSettings);
router.get('/', protect, authorizeRoles('admin'), settingsController.getAllSettings);
router.post('/', protect, authorizeRoles('admin'), settingsController.createSetting);
router.put('/:key', protect, authorizeRoles('admin'), settingsController.updateSetting);
router.delete('/:key', protect, authorizeRoles('admin'), settingsController.deleteSetting);

module.exports = router;
