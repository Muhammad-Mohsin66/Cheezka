const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Rider = require('../models/Rider');
const Product = require('../models/Product');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const test = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const order = await Order.findOne();
  if (!order) {
    console.log('No order found to test.');
    process.exit(0);
  }
  
  console.log('Found order:', order._id);
  console.log('Current status:', order.orderStatus);
  
  try {
    order.orderStatus = 'Assigned to Rider';
    await order.save();
    console.log('Successfully updated order status to', order.orderStatus);
  } catch (err) {
    console.error('Error updating order:', err);
  }
  
  process.exit(0);
};

test();
