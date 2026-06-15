const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const BankAccount = require('../models/BankAccount');

const clearBankAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    const result = await BankAccount.deleteMany({});
    console.log(`Deleted ${result.deletedCount} dummy bank accounts.`);

    process.exit(0);
  } catch (error) {
    console.error('Error clearing bank accounts:', error);
    process.exit(1);
  }
};

clearBankAccounts();
