const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cheezka');
  
  const SystemSetting = mongoose.model('SystemSetting', new mongoose.Schema({}, { strict: false }));
  const DeliveryZone = mongoose.model('DeliveryZone', new mongoose.Schema({}, { strict: false }));
  const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
  
  const settings = await SystemSetting.find({ key: 'DELIVERY_BASE_CHARGE' });
  console.log('Settings:', settings);
  
  const zones = await DeliveryZone.find({});
  console.log('Zones:', zones);

  const orders = await Order.find().sort({ createdAt: -1 }).limit(1);
  console.log('Latest Order:', orders);
  
  mongoose.disconnect();
}
check();
