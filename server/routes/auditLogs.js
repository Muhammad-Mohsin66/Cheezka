const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const auditLogController = require('../controllers/auditLogController');

router.get('/stats', protect, authorizeRoles('admin'), auditLogController.getAuditStats);
router.get('/', protect, authorizeRoles('admin'), auditLogController.getAuditLogs);

module.exports = router;
