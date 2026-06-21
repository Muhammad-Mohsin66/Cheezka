require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    // Manually fetch from collection instead of using mongoose models to avoid missing schema errors
    const db = mongoose.connection.db;
    const products = await db.collection('products').find().sort({createdAt: -1}).limit(3).toArray();
    console.log("RECENT IMAGE URLS:", products.map(p => p.image));
    process.exit(0);
  })
  .catch(console.error);
