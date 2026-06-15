const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const users = await db.collection('users').find().toArray();
  const customers = await db.collection('customers').find().toArray();
  const riders = await db.collection('riders').find().toArray();
  const employees = await db.collection('employees').find().toArray();
  
  console.log('Users collection:', users.length);
  console.log('Users roles:', users.map(u => u.role));
  console.log('Customers collection:', customers.length);
  console.log('Riders collection:', riders.length);
  console.log('Employees collection:', employees.length);
  
  process.exit(0);
};

check();
