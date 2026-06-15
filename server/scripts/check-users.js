const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Employee = require('../models/Employee');
const Rider = require('../models/Rider');
const Customer = require('../models/Customer');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const admins = await User.find({});
  const employees = await Employee.find({});
  const riders = await Rider.find({});
  const customers = await Customer.find({});

  console.log('Admins:', admins.length);
  if (admins.length > 0) {
    const admin = await User.findById(admins[0]._id).select('+password');
    admin.password = 'password123';
    await admin.save();
    console.log('Sample Admin:', admin.email, 'password updated to password123');
  }

  console.log('Employees:', employees.map(e => e.email));
  console.log('Riders:', riders.map(r => r.email));
  console.log('Customers:', customers.map(c => c.email));

  const spamEmails = ['kjahsajk2@gmail.com', 'haaha2@gmail.com', 'jhashaj2@cheezka.com', '1@gmail.com'];
  
  await Employee.deleteMany({ email: { $in: spamEmails } });
  await Rider.deleteMany({ email: { $in: spamEmails } });
  await Customer.deleteMany({ email: { $in: spamEmails } });
  
  console.log('Spam data deleted.');

  process.exit(0);
};

run().catch(console.error);
