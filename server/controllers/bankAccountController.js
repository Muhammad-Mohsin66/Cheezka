const BankAccount = require('../models/BankAccount');
const AppError = require('../utils/AppError');
const { createAuditEntry } = require('./auditLogController');

/**
 * ADMIN ACTIONS
 */

/**
 * Create bank account
 */
exports.createBankAccount = async (req, res) => {
  const { bankName, accountTitle, accountNumber, iban } = req.body;

  // Validation
  if (!bankName || bankName.trim().length === 0) {
    throw new AppError('Bank name is required', 400);
  }

  if (!accountTitle || accountTitle.trim().length === 0) {
    throw new AppError('Account title is required', 400);
  }

  if (!accountNumber || accountNumber.trim().length === 0) {
    throw new AppError('Account number is required', 400);
  }

  // Create account
  const bankAccount = await BankAccount.create({
    bankName: bankName.trim(),
    accountTitle: accountTitle.trim(),
    accountNumber: accountNumber.trim(),
    iban: iban ? iban.trim() : null,
    isActive: true,
  });

  // Create Audit Log
  await createAuditEntry(req, 'create', 'BankAccount', bankAccount._id, bankAccount.bankName);

  res.status(201).json({
    success: true,
    message: 'Bank account created successfully',
    data: bankAccount,
  });
};

/**
 * Update bank account
 */
exports.updateBankAccount = async (req, res) => {
  const { accountId } = req.params;
  const { bankName, accountTitle, accountNumber, iban } = req.body;

  // Fetch account
  const bankAccount = await BankAccount.findById(accountId);
  if (!bankAccount) {
    throw new AppError('Bank account not found', 404);
  }

  // Update fields (only provided ones)
  if (bankName) bankAccount.bankName = bankName.trim();
  if (accountTitle) bankAccount.accountTitle = accountTitle.trim();
  if (accountNumber) bankAccount.accountNumber = accountNumber.trim();
  if (iban !== undefined) bankAccount.iban = iban ? iban.trim() : null;

  await bankAccount.save();

  // Create Audit Log
  await createAuditEntry(req, 'update', 'BankAccount', bankAccount._id, bankAccount.bankName);

  res.status(200).json({
    success: true,
    message: 'Bank account updated successfully',
    data: bankAccount,
  });
};

/**
 * Deactivate bank account
 */
exports.deactivateBankAccount = async (req, res) => {
  const { accountId } = req.params;

  // Fetch account
  const bankAccount = await BankAccount.findById(accountId);
  if (!bankAccount) {
    throw new AppError('Bank account not found', 404);
  }

  // Check if already inactive
  if (!bankAccount.isActive) {
    throw new AppError('Bank account is already inactive', 400);
  }

  // Deactivate
  bankAccount.isActive = false;
  await bankAccount.save();

  // Create Audit Log
  await createAuditEntry(req, 'delete', 'BankAccount', bankAccount._id, bankAccount.bankName);

  res.status(200).json({
    success: true,
    message: 'Bank account deactivated successfully',
    data: bankAccount,
  });
};

/**
 * Get all active bank accounts
 * PUBLIC: Anyone can view active accounts (for payment instructions)
 */
exports.getAllBankAccounts = async (req, res) => {
  // Only show active accounts
  const accounts = await BankAccount.find({ isActive: true });

  res.status(200).json({
    success: true,
    count: accounts.length,
    data: accounts,
  });
};

/**
 * Get all bank accounts (including inactive)
 * ADMIN ONLY
 */
exports.getAdminBankAccounts = async (req, res) => {
  const accounts = await BankAccount.find({});

  res.status(200).json({
    success: true,
    count: accounts.length,
    data: accounts,
  });
};


/**
 * Get single bank account
 */
exports.getBankAccountDetails = async (req, res) => {
  const { accountId } = req.params;

  const account = await BankAccount.findById(accountId);
  if (!account) {
    throw new AppError('Bank account not found', 404);
  }

  // Show full details only to admin, otherwise only active accounts
  if (account.isActive === false && (!req.user || req.user.role !== 'admin')) {
    throw new AppError('Bank account not found', 404);
  }

  res.status(200).json({
    success: true,
    data: account,
  });
};
