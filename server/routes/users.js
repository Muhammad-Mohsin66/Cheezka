const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const usersController = require('../controllers/usersController');

// Stats (before /:id to prevent conflict)
router.get('/stats', protect, authorizeRoles('admin'), usersController.getUserStats);

// CRUD
router.get('/', protect, authorizeRoles('admin'), usersController.getAllUsers);
router.post('/', protect, authorizeRoles('admin'), usersController.createUser);
router.get('/:id', protect, authorizeRoles('admin'), usersController.getUserById);
router.put('/:id', protect, authorizeRoles('admin'), usersController.updateUser);
router.patch('/:id/toggle', protect, authorizeRoles('admin'), usersController.toggleUserStatus);
router.patch('/:id/password', protect, authorizeRoles('admin'), usersController.resetUserPassword);
router.delete('/:id', protect, authorizeRoles('admin'), usersController.deleteUser);

module.exports = router;
