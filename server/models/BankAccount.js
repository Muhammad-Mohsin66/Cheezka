const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * BankAccount Model
 * Stores bank account information for payment collection
 * - Public: can view all active accounts
 * - Admin: can manage accounts
 */
const bankAccountSchema = new Schema(
  {
    // Bank Name
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
      maxlength: [100, 'Bank name cannot exceed 100 characters'],
    },

    // Account Title (Name)
    accountTitle: {
      type: String,
      required: [true, 'Account title is required'],
      trim: true,
      maxlength: [100, 'Account title cannot exceed 100 characters'],
    },

    // Account Number
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
      maxlength: [30, 'Account number cannot exceed 30 characters'],
    },

    // IBAN (Optional - International Bank Account Number)
    iban: {
      type: String,
      default: null,
      trim: true,
      maxlength: [50, 'IBAN cannot exceed 50 characters'],
    },

    // Active Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for active accounts
bankAccountSchema.index({ isActive: 1 });

module.exports = mongoose.model('BankAccount', bankAccountSchema);
