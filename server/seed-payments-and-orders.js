const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Payment = require('./models/Payment');
const Order = require('./models/Order');
const Customer = require('./models/Customer');
const User = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cheezka_db');
  
  const customer = await Customer.findOne();
  if (!customer) {
    console.log("No customer found.");
    process.exit(1);
  }

  const admin = await User.findOne({ role: 'admin' });

  // Create 3 dummy orders with Online/Bank Transfer
  const orderDocs = await Order.insertMany([
    {
      customer: customer._id,
      items: [{ product: new mongoose.Types.ObjectId(), name: "Zinger Burger", quantity: 2, price: 300 }],
      subtotal: 600,
      deliveryFee: 100,
      grandTotal: 700,
      paymentMethod: 'Online',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      shippingAddress: { address: 'Test Address', city: 'Test City' }
    },
    {
      customer: customer._id,
      items: [{ product: new mongoose.Types.ObjectId(), name: "Chicken Shawarma", quantity: 1, price: 150 }],
      subtotal: 150,
      deliveryFee: 100,
      grandTotal: 250,
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      shippingAddress: { address: 'Test Address', city: 'Test City' }
    },
    {
      customer: customer._id,
      items: [{ product: new mongoose.Types.ObjectId(), name: "Pizza", quantity: 1, price: 1000 }],
      subtotal: 1000,
      deliveryFee: 100,
      grandTotal: 1100,
      paymentMethod: 'JazzCash',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      shippingAddress: { address: 'Test Address', city: 'Test City' }
    }
  ]);

  const paymentsData = [
    {
      order: orderDocs[0]._id,
      user: customer._id,
      paymentMethod: orderDocs[0].paymentMethod,
      screenshot: 'https://via.placeholder.com/600x800.png?text=Online+Payment+Receipt',
      amount: orderDocs[0].grandTotal,
      status: 'Pending',
      adminNote: '',
      verifiedAt: null
    },
    {
      order: orderDocs[1]._id,
      user: customer._id,
      paymentMethod: orderDocs[1].paymentMethod,
      screenshot: 'https://via.placeholder.com/600x800.png?text=Bank+Transfer+Receipt',
      amount: orderDocs[1].grandTotal,
      status: 'Verified',
      adminNote: 'Looks good. Verified.',
      verifiedBy: admin ? admin._id : null,
      verifiedAt: new Date()
    },
    {
      order: orderDocs[2]._id,
      user: customer._id,
      paymentMethod: orderDocs[2].paymentMethod,
      screenshot: 'https://via.placeholder.com/600x800.png?text=JazzCash+Receipt',
      amount: orderDocs[2].grandTotal,
      status: 'Rejected',
      adminNote: 'Transaction ID is not visible in screenshot',
      verifiedBy: admin ? admin._id : null,
      verifiedAt: new Date()
    }
  ];
  
  await Payment.insertMany(paymentsData);
  console.log(`Successfully created 3 dummy orders and payments!`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
