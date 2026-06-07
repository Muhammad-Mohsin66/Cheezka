const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const deliveryZoneController = require('../controllers/deliveryZoneController');

router.get('/', deliveryZoneController.getAllZones);         // Public (needed by storefront)
router.get('/:id', deliveryZoneController.getZoneById);     // Public

router.post('/', protect, authorizeRoles('admin'), deliveryZoneController.createZone);
router.put('/:id', protect, authorizeRoles('admin'), deliveryZoneController.updateZone);
router.patch('/:id/toggle', protect, authorizeRoles('admin'), deliveryZoneController.toggleZone);
router.delete('/:id', protect, authorizeRoles('admin'), deliveryZoneController.deleteZone);

module.exports = router;
