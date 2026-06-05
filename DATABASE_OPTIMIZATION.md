# Phase 2 - Database & Performance Optimization

## MongoDB Indexes for Authentication

### Why Indexes?
- Faster queries (especially for authentication lookups)
- Enforces uniqueness at database level
- Improves performance for frequent operations

### Recommended Indexes

#### 1. User Model Indexes

Add these indexes to `server/models/User.js` after the schema definition:

```javascript
// Unique indexes for authentication
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });

// Indexes for queries
userSchema.index({ isEmailVerified: 1 });
userSchema.index({ isActive: 1 });

// Indexes for token lookups
userSchema.index({ emailVerificationExpire: 1 });
userSchema.index({ resetPasswordExpire: 1 });
userSchema.index({ otpExpire: 1 });

// Compound indexes for faster queries
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
```

### MongoDB Commands for Testing

#### Create Indexes via MongoDB Shell

```bash
# Connect to MongoDB
mongo
use cheezka

# Create unique indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { unique: true })

# Create performance indexes
db.users.createIndex({ isEmailVerified: 1 })
db.users.createIndex({ isActive: 1 })
db.users.createIndex({ emailVerificationExpire: 1 })
db.users.createIndex({ resetPasswordExpire: 1 })
db.users.createIndex({ otpExpire: 1 })

# Compound indexes
db.users.createIndex({ email: 1, isActive: 1 })
db.users.createIndex({ role: 1, isActive: 1 })

# View all indexes
db.users.getIndexes()
```

#### Drop Indexes (if needed)
```bash
# Drop a specific index
db.users.dropIndex("email_1")

# Drop all indexes except _id
db.users.dropIndexes()
```

---

## Query Performance

### Authentication Queries (Before & After Indexes)

#### Register/Login Query
```javascript
// Query: db.users.findOne({ email: email })
// Without index: ~100ms (collection scan)
// With index: ~1ms (index lookup)
// Performance improvement: 100x faster
```

#### Get All Active Users
```javascript
// Query: db.users.find({ isActive: true })
// Without index: ~50ms
// With index: ~2ms
```

#### Token Cleanup
```javascript
// Query: db.users.updateMany({ emailVerificationExpire: { $lt: Date.now() } })
// Without index: ~200ms
// With index: ~5ms
```

---

## Setup Instructions

### Option 1: Automatic (Recommended)
Indexes are automatically created when you define them in the Mongoose schema. They're created on first use.

```javascript
// In server/models/User.js

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
// ... other indexes
```

### Option 2: Manual via MongoDB Shell
```bash
# Connect to MongoDB shell
mongo mongodb://localhost:27017/cheezka

# Run index creation commands (see above)
```

### Option 3: Verify with Mongoose
```javascript
// Test in your Node.js app
const User = require('./models/User');

User.collection.getIndexes((err, indexes) => {
  console.log('Existing indexes:', indexes);
});
```

---

## Performance Monitoring

### Check Query Performance

```javascript
// Add to your controller for monitoring
const start = Date.now();
const user = await User.findOne({ email });
const duration = Date.now() - start;
console.log(`Query took ${duration}ms`);
```

### MongoDB Explain Plan
```bash
# In MongoDB shell
db.users.find({ email: "test@example.com" }).explain("executionStats")

# Check if index was used
# "executionStages": { "stage": "COLLSCAN" } = No index (slow)
# "executionStages": { "stage": "IXSCAN" } = Index used (fast)
```

---

## Best Practices

### ✅ DO
- Create indexes on frequently queried fields
- Use unique indexes for email/phone
- Monitor query performance
- Drop unused indexes periodically
- Test with realistic data volumes

### ❌ DON'T
- Create too many indexes (write performance suffers)
- Index every field (waste of storage)
- Ignore index maintenance
- Run indexes on low-cardinality fields
- Forget to index compound queries

---

## Scaling Considerations

### Small Database (< 1MB, < 1000 users)
- Indexes less critical
- Still recommended for uniqueness enforcement

### Medium Database (1MB - 100MB, 1000-100K users)
- Indexes essential for performance
- Monitor query speeds regularly

### Large Database (> 100MB, > 100K users)
- Indexes critical
- Consider compound indexes
- May need query optimization
- Consider database sharding

---

## Monitoring Template

Create a script to monitor authentication performance:

```javascript
// performance-monitor.js
const User = require('./models/User');

async function monitorQueries() {
  console.log('🔍 Query Performance Monitor\n');

  // Test 1: Email lookup
  console.time('Email lookup');
  await User.findOne({ email: 'test@example.com' });
  console.timeEnd('Email lookup');

  // Test 2: Active users
  console.time('Active users query');
  await User.find({ isActive: true }).limit(10);
  console.timeEnd('Active users query');

  // Test 3: Role query
  console.time('Role query');
  await User.find({ role: 'admin' });
  console.timeEnd('Role query');

  // Test 4: Get indexes
  const indexes = await User.collection.getIndexes();
  console.log('\n📊 Database Indexes:', Object.keys(indexes));
}

monitorQueries().catch(console.error);
```

Run with:
```bash
node performance-monitor.js
```

---

## Maintenance Script

Create periodic cleanup for expired tokens:

```javascript
// scripts/cleanup-tokens.js
const User = require('../models/User');

async function cleanupExpiredTokens() {
  try {
    const now = new Date();
    
    // Remove expired verification tokens
    const result = await User.updateMany(
      { emailVerificationExpire: { $lt: now } },
      { 
        $unset: { 
          emailVerificationToken: 1,
          emailVerificationExpire: 1 
        }
      }
    );

    console.log(`Cleaned up ${result.modifiedCount} expired verification tokens`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

cleanupExpiredTokens();
```

Schedule this with cron or node-schedule:
```bash
npm install node-schedule

# Add to index.js:
const schedule = require('node-schedule');
schedule.scheduleJob('0 3 * * *', cleanupExpiredTokens); // Daily at 3 AM
```

---

## Troubleshooting

### Problem: Slow login queries
**Solution**: Verify email index exists
```javascript
db.users.getIndexes()
// Should show: { "email": 1, "unique": true }
```

### Problem: Duplicate email not prevented
**Solution**: Recreate unique index
```javascript
db.users.dropIndex({ email: 1 })
db.users.createIndex({ email: 1 }, { unique: true })
```

### Problem: Queries still slow after indexing
**Solution**: Check query plan
```javascript
db.users.find({ email: "test@test.com" }).explain("executionStats")
```

### Problem: Index not being used
**Solution**: Rebuild indexes
```javascript
db.users.reIndex()
```

---

## Summary

| Task | Performance Impact | Priority |
|------|-------------------|----------|
| Email unique index | 100x faster lookups | **HIGH** |
| Phone unique index | 100x faster lookups | **HIGH** |
| isActive index | 50x faster queries | **MEDIUM** |
| isEmailVerified index | 50x faster queries | **MEDIUM** |
| Token expiry indexes | Cleanup performance | **MEDIUM** |
| Compound indexes | 10-20x faster | **LOW** |

---

## Additional Resources

- [MongoDB Indexing Best Practices](https://docs.mongodb.com/manual/indexes/)
- [Mongoose Indexing](https://mongoosejs.com/docs/guide.html#indexes)
- [MongoDB Performance Tuning](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)

---

Last Updated: May 16, 2026
