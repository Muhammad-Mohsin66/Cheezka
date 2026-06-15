const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const Customer = require('../models/Customer');
const Rider = require('../models/Rider');
const Employee = require('../models/Employee');
const User = require('../models/User');

const migrateUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('MongoDB Connected...');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find all users who are not admin
    const usersToMigrate = await usersCollection.find({ role: { $ne: 'admin' } }).toArray();
    
    console.log(`Found ${usersToMigrate.length} users to migrate.`);

    for (let user of usersToMigrate) {
      const { role } = user;
      let targetCollection;
      
      if (role === 'customer') {
        targetCollection = Customer.collection;
      } else if (role === 'rider') {
        targetCollection = Rider.collection;
      } else if (role === 'employee') {
        targetCollection = Employee.collection;
      } else {
        console.warn(`Unknown role "${role}" for user ${user.email}. Skipping.`);
        continue;
      }

      try {
        // Insert into target collection, bypassing mongoose hooks to prevent double-hashing passwords
        await targetCollection.insertOne(user);
        
        // Remove from users collection
        await usersCollection.deleteOne({ _id: user._id });
        
        console.log(`Successfully migrated ${user.email} to ${role}s collection.`);
      } catch (err) {
        if (err.code === 11000) {
          console.log(`User ${user.email} already exists in ${role}s collection. Removing from users collection.`);
          await usersCollection.deleteOne({ _id: user._id });
        } else {
          console.error(`Error migrating user ${user.email}:`, err.message);
        }
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateUsers();
