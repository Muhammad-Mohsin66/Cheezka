const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Payment = require('./models/Payment');
const Order = require('./models/Order');
const Customer = require('./models/Customer');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cheezka_db');
  
  const orders = await Order.find({ paymentMethod: { $in: ['Online', 'Bank Transfer', 'JazzCash', 'EasyPaisa'] } }).limit(5);
  
  if (orders.length === 0) {
    console.log("No non-COD orders found to attach payments to.");
    process.exit(1);
  }

  const paymentsData = [];
  
  // Create dummy payments
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const customerId = order.customer;
    
    let status = 'Pending';
    if (i === 1) status = 'Verified';
    if (i === 2) status = 'Rejected';

    paymentsData.push({
      order: order._id,
      user: customerId,
      paymentMethod: order.paymentMethod,
      screenshot: 'https://via.placeholder.com/600x800.png?text=Dummy+Payment+Receipt',
      amount: order.grandTotal,
      status: status,
      adminNote: status === 'Rejected' ? 'Transaction ID mismatch' : (status === 'Verified' ? 'Verified successfully' : ''),
      verifiedAt: status !== 'Pending' ? new Date() : null
    });
  }
  
  await Payment.insertMany(paymentsData);
  console.log(`Successfully created ${paymentsData.length} dummy payments!`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
