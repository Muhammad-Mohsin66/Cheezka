require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  require('./models/Category'); // Load Category schema
  const Product = require('./models/Product');
  const products = await Product.find({}, 'name image').sort({ updatedAt: -1 }).limit(3);
  console.log("RECENT PRODUCTS IN DB:", products);
  process.exit(0);
});
