const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const Customer = require('../models/Customer');
const Rider = require('../models/Rider');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  try {
    await Customer.deleteOne({ email: 'testcustomer@cheezka.com' });
    await Rider.deleteOne({ email: 'testrider@cheezka.com' });
    console.log('Deleted test users');
  } catch (err) {
    console.error('Error:', err);
  }

  process.exit(0);
};

run();
