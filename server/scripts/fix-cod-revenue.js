const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const Order = require('../models/Order');

const fixCodRevenue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    const result = await Order.updateMany(
      { orderStatus: 'Delivered', paymentMethod: 'COD', paymentStatus: 'Pending' },
      { $set: { paymentStatus: 'Verified' } }
    );
    console.log(`Updated ${result.modifiedCount} historical COD orders to Verified payment status.`);

    process.exit(0);
  } catch (error) {
    console.error('Error fixing historical orders:', error);
    process.exit(1);
  }
};

fixCodRevenue();
