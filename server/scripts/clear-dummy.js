require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cheezka';

const models = {
  User: require('../models/User'),
  Customer: require('../models/Customer'),
  Employee: require('../models/Employee'),
  Rider: require('../models/Rider'),
  Category: require('../models/Category'),
  Product: require('../models/Product'),
  Deal: require('../models/Deal'),
  DeliveryZone: require('../models/DeliveryZone'),
  BankAccount: require('../models/BankAccount'),
  Order: require('../models/Order'),
  Payment: require('../models/Payment'),
  Refund: require('../models/Refund'),
  InventoryLog: require('../models/InventoryLog'),
  AuditLog: require('../models/AuditLog'),
  OrderStatusLog: require('../models/OrderStatusLog'),
  Notification: require('../models/Notification'),
  RiderAvailability: require('../models/RiderAvailability'),
};

const CUTOFF_DATE = new Date('2026-06-13T17:30:00Z');

async function clearDummy() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');
  console.log('Clearing dummy data created before:', CUTOFF_DATE.toISOString());

  for (const [name, model] of Object.entries(models)) {
    const result = await model.deleteMany({ createdAt: { $lt: CUTOFF_DATE } });
    console.log(`Deleted ${result.deletedCount} dummy documents from ${name}.`);
  }

  console.log('Cleanup completed successfully.');
  await mongoose.disconnect();
}

clearDummy().catch(console.error);
