const fs = require('fs');
const FormData = require('form-data');
const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./models/User');
  const user = await User.findOne({ role: 'admin' });
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const form = new FormData();
  form.append('image', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'), { filename: 'test.png', contentType: 'image/png' });

  const http = require('http');
  const req = http.request({
    hostname: 'localhost',
    port: process.env.PORT || 5001,
    path: '/api/upload/product',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...form.getHeaders()
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
  
  form.pipe(req);
}
test();
