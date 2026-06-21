const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = require('./models/Product');
  const Category = require('./models/Category');
  
  const product = await Product.findOne({ name: 'Omelette Burger' });
  if (!product) return console.log("Product not found");

  const category = await Category.findOne({ name: 'Burgers' });

  // Simulate update payload
  const payload = {
    name: "Omelette Burger",
    category: category._id.toString(),
    basePrice: 150,
    stockQuantity: 95,
    sizes: [{ size: "M", price: 150 }],
    description: "",
    isActive: true
  };

  const User = require('./models/User');
  const user = await User.findOne({ role: 'admin' });
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const http = require('http');
  const req = http.request({
    hostname: 'localhost',
    port: process.env.PORT || 5001,
    path: `/api/products/${product._id}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      console.log('BODY:', data);
      process.exit(0);
    });
  });
  
  req.write(JSON.stringify(payload));
  req.end();
}
test();
