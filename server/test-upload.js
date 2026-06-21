require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "cheezka/products",
  },
});

const upload = multer({ storage: storage });

const express = require('express');
const app = express();
app.post('/test-upload', upload.single('image'), (req, res) => {
  res.json({ file: req.file });
});
app.use((err, req, res, next) => {
  console.log("EXPRESS ERROR:", err);
  res.status(500).json({ error: err.message });
});

const server = app.listen(5006, () => {
  const request = require('http').request;
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const postData = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n` +
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64').toString('binary') +
    `\r\n--${boundary}--\r\n`;

  const req = request({
    hostname: 'localhost', port: 5006, path: '/test-upload', method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(postData, 'binary') }
  }, (res) => {
    let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => {
      console.log('UPLOAD RESULT:', data); server.close();
    });
  });
  req.write(postData, 'binary'); req.end();
});
