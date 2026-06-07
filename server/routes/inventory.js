const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

// Static routes before dynamic
router.get('/alerts', protect, authorizeRoles('admin', 'employee'), inventoryController.getStockAlerts);
router.get('/summary', protect, authorizeRoles('admin', 'employee'), inventoryController.getInventorySummary);
router.get('/logs', protect, authorizeRoles('admin'), inventoryController.getInventoryLogs);
router.post('/adjust', protect, authorizeRoles('admin'), inventoryController.adjustStock);
router.get('/', protect, authorizeRoles('admin', 'employee'), inventoryController.getInventory);

module.exports = router;
