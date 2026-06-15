const express = require('express');
const router = express.Router();
const bankAccountController = require('../controllers/bankAccountController');
const { protect, authorizeRoles } = require('../middleware/auth');

/**
 * PUBLIC ROUTES
 */

// Get all active bank accounts (public - for payment instructions)
router.get('/', bankAccountController.getAllBankAccounts);

// Get single bank account details (public - if active)
router.get('/:accountId/details', bankAccountController.getBankAccountDetails);

/**
 * ADMIN ROUTES (Protected)
 */

// Get all bank accounts including inactive (admin only)
router.get('/admin', protect, authorizeRoles('admin'), bankAccountController.getAdminBankAccounts);

// Create bank account (admin only)
router.post('/', protect, authorizeRoles('admin'), bankAccountController.createBankAccount);

// Update bank account (admin only)
router.patch('/:accountId', protect, authorizeRoles('admin'), bankAccountController.updateBankAccount);

// Deactivate bank account (admin only)
router.patch(
  '/:accountId/deactivate',
  protect,
  authorizeRoles('admin'),
  bankAccountController.deactivateBankAccount
);

module.exports = router;
