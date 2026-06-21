require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Product = require('./server/models/Product');
  const products = await Product.find({}, 'name image').sort({ updatedAt: -1 }).limit(3);
  console.log(products);
  process.exit(0);
});
