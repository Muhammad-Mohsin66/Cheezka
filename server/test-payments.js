const mongoose = require('mongoose');
require('dotenv').config();
const Payment = require('./models/Payment');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cheezka_db')
.then(async () => {
  const count = await Payment.countDocuments();
  console.log("Total Payments in DB:", count);
  const payments = await Payment.find().limit(1).lean();
  console.log("Sample Payment:", JSON.stringify(payments, null, 2));
  process.exit(0);
});
