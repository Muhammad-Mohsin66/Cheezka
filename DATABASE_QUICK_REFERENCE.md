# ⚡ Database Architecture - Developer Quick Reference Card

**Keep This Nearby!** 📍

---

## 🚀 One-Minute Setup

```bash
# 1. Copy all model files to server/models/
# 2. Copy all service files to server/services/
# 3. Create server/models/index.js (export hub)
# 4. Create server/services/index.js (export hub)
# 5. Run npm install (no new packages needed)
# 6. Create MongoDB indexes
# 7. Update controllers
# 8. Test and deploy
```

---

## 📁 File Locations Quick Map

```
✅ All 17 Models          → server/models/
✅ All 3 Services         → server/services/
✅ Export Hub (models)    → server/models/index.js
✅ Export Hub (services)  → server/services/index.js
✅ Controller Examples    → See DATABASE_INTEGRATION_GUIDE.md
```

---

## 🔗 17 New Collections at a Glance

```javascript
// Authentication (4)
✅ Role                    // Users roles + permissions
✅ OTPVerification         // 2FA codes (auto-expire)
✅ EmailToken              // Email verification (auto-expire)
✅ Session                 // Multi-device login (auto-expire)

// Products (3)
✅ ProductSize             // Per-size variants + pricing
✅ ProductImage            // Product gallery
✅ Deal                     // Promotions + combos

// Orders (2)
✅ OrderItem               // Order line items
✅ OrderStatusLog          // Status change history

// Payments & Refunds (2)
✅ PaymentLog              // Payment actions history
✅ RefundLog               // Refund actions history

// Delivery (3)
✅ DeliveryZone            // Geographic zones (GeoJSON)
✅ DeliveryAssignment      // Rider assignments
✅ RiderAvailability       // Real-time rider location

// System Tracking (3)
✅ InventoryLog            // Stock change history
✅ AuditLog                // Admin action history
✅ SystemSetting           // Centralized config
```

---

## 🎯 Key Relationships (Copy This!)

```javascript
const models = {
  // User can have many...
  User: {
    sessions: 'N',
    otpVerifications: 'N',
    emailTokens: 'N',
    orders: 'N',
    deliveryAssignments: 'N',
    auditLogs: 'N'
  },

  // Product has many...
  Product: {
    productSizes: 'N',
    productImages: 'N',
    orderItems: 'N',
    inventoryLogs: 'N',
    deals: 'N'
  },

  // Order has many...
  Order: {
    orderItems: 'N',
    orderStatusLogs: 'N',
    deliveryAssignments: 'N',
    payment: '1'
  },

  // Payment/Refund have logs
  Payment: { paymentLogs: 'N' },
  Refund: { refundLogs: 'N' }
};
```

---

## 📝 Most Common Code Patterns

### Pattern 1: Import Models
```javascript
const { Order, OrderStatusLog, OrderItem, InventoryLog, AuditLog } = require('../models');
```

### Pattern 2: Import Services
```javascript
const { statusLogService, inventoryLogService, auditLogService } = require('../services');
```

### Pattern 3: Log Order Status
```javascript
await statusLogService.logOrderStatusChange(
  orderId,
  previousStatus,
  newStatus,
  userId,
  'Optional reason'
);
```

### Pattern 4: Log Inventory Change
```javascript
await inventoryLogService.logOrderInventoryChange(
  productId,
  quantity,
  orderId,
  userId
);
```

### Pattern 5: Log Audit Action
```javascript
await auditLogService.logProductCreate(
  userId,
  product,
  req.ip,
  req.get('user-agent')
);
```

### Pattern 6: Get Status History
```javascript
const history = await OrderStatusLog.find({ order: orderId })
  .sort({ createdAt: -1 })
  .populate('changedBy', 'name email');
```

### Pattern 7: Get Inventory History
```javascript
const logs = await InventoryLog.find({ product: productId })
  .sort({ createdAt: -1 })
  .limit(50);
```

---

## ✨ Critical Indexes (Create These!)

```javascript
// TTL Indexes (Auto-delete expired)
db.otpverifications.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
db.emailtokens.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Geospatial (Location queries)
db.deliveryzones.createIndex({ coordinates: "2dsphere" });
db.rideravailability.createIndex({ currentLocation: "2dsphere" });

// Foreign Key Indexes
db.orderitems.createIndex({ order: 1 });
db.orderitems.createIndex({ product: 1 });
db.orderstatuslogs.createIndex({ order: 1, createdAt: -1 });
db.inventorylogs.createIndex({ product: 1, createdAt: -1 });
db.auditlogs.createIndex({ user: 1, createdAt: -1 });
```

---

## 🔧 Controller Update Checklist

### OrderController
```javascript
// ✅ Add to placeOrder()
await statusLogService.logOrderStatusChange(order._id, null, 'Pending', userId);
for (const item of order.items) {
  await inventoryLogService.logOrderInventoryChange(item.product, item.quantity, orderId, userId);
}

// ✅ Add to updateOrderStatus()
await statusLogService.logOrderStatusChange(orderId, prev, curr, userId);
if (cancelled) {
  await inventoryLogService.logCancellationInventoryReturn(productId, qty, orderId, userId);
}

// ✅ Add endpoint
router.get('/:orderId/status-history', getOrderStatusHistory);
```

### PaymentController
```javascript
// ✅ Add to verifyPayment()
await statusLogService.logPaymentAction(paymentId, 'verified', userId, 'Payment verified');

// ✅ Add to rejectPayment()
await statusLogService.logPaymentAction(paymentId, 'rejected', userId, reason);

// ✅ Add endpoint
router.get('/:paymentId/history', getPaymentHistory);
```

### RefundController
```javascript
// ✅ Add to approveRefund()
await statusLogService.logRefundAction(refundId, 'approved', userId, amount);

// ✅ Add endpoint
router.get('/:refundId/history', getRefundHistory);
```

### ProductController
```javascript
// ✅ Add to createProduct()
await auditLogService.logProductCreate(userId, product, req.ip, req.get('user-agent'));

// ✅ Add to updateProduct()
await auditLogService.logProductUpdate(userId, id, name, before, after, ip, ua);

// ✅ Add to deleteProduct()
await auditLogService.logProductDelete(userId, id, name, ip, ua);
```

---

## 🧪 Quick Test Commands

```javascript
// Create test order
const order = await Order.create({ customer, items, totalAmount });

// Verify status log created
const statusLog = await OrderStatusLog.findOne({ order: order._id });
console.log(statusLog); // Should exist

// Verify inventory logs created
const invLogs = await InventoryLog.find({ relatedOrder: order._id });
console.log(invLogs.length); // Should match items count

// Get full history
const history = await OrderStatusLog.find({ order: order._id }).sort({ createdAt: -1 });
console.log(history);

// Check inventory discrepancies
const logs = await InventoryLog.find({ product: productId });
let calculated = 0;
logs.forEach(l => calculated += l.changeType === 'increase' ? l.quantity : -l.quantity);
const product = await Product.findById(productId);
console.log('Discrepancy:', product.stock - calculated);
```

---

## ⚡ Performance Tips

```javascript
// ❌ Slow - No index
await OrderStatusLog.find({ reason: 'Customer request' });

// ✅ Fast - Indexed field
await OrderStatusLog.find({ order: orderId }).sort({ createdAt: -1 });

// ❌ Slow - Full collection
await InventoryLog.find({});

// ✅ Fast - With pagination
await InventoryLog.find({ product: id }).limit(50).skip(0);

// ✅ Use lean() for read-only
await Order.find({}).lean();

// ✅ Select only needed fields
await Order.find({}).select('status totalAmount createdAt');
```

---

## 🐛 Debugging Quick Guide

| Issue | Check | Fix |
|-------|-------|-----|
| Models undefined | `const { Order } = require('../models')` | Create index.js |
| Services not found | Import path correct? | Check services/index.js |
| Logs not created | Service called? | Add error handling |
| Slow queries | `explain("executionStats")` | Create indexes |
| Duplicate logs | Called twice? | Add guard clause |
| Memory issue | Too many docs? | Implement pagination |

---

## 📊 Data Volume Estimates

| Collection | Est. Records/Year | Size (MB) |
|-----------|------------------|-----------|
| Order | 50,000 | 250 |
| OrderItem | 150,000 | 180 |
| OrderStatusLog | 250,000 | 120 |
| InventoryLog | 100,000 | 100 |
| PaymentLog | 50,000 | 50 |
| AuditLog | 200,000 | 200 |
| Session | 50,000 | 100 |
| **TOTAL** | **855,000** | **1,010** |

---

## 🔒 Security Reminders

```javascript
// ✅ Sensitive fields hidden by default
schema.select(false); // Use this for passwords, tokens

// ✅ Audit all admin actions
await auditLogService.log(...); // Every create/update/delete

// ✅ Validate permissions
if (!hasPermission(user, action)) throw new Error('Forbidden');

// ✅ Log failed attempts
await auditLogService.logFailedAttempt(...);

// ✅ Track IP addresses
ip = req.ip;
userAgent = req.get('user-agent');
```

---

## 🚀 Deployment Checklist

```
Before going live:

☐ All 17 models copied
☐ All 3 services copied  
☐ All indexes created
☐ Controllers updated
☐ Tests passing
☐ Staging deployed (24h)
☐ Monitoring enabled
☐ Alerts configured
☐ Backup created
☐ Team trained
```

---

## 📚 Documentation Map

| Document | Purpose | Read Time |
|----------|---------|-----------|
| DATABASE_COMPLETE_SUMMARY.md | Overview & quick ref | 5 min |
| DATABASE_ARCHITECTURE_v2.0.md | Technical deep dive | 20 min |
| DATABASE_INTEGRATION_GUIDE.md | Step-by-step guide | 15 min |
| DATABASE_IMPLEMENTATION_CHECKLIST.md | Progress tracker | Reference |
| DATABASE_QUICK_REFERENCE.md | This reference card | 2 min |

---

## 🎯 Remember These!

```javascript
// The 3 Key Services
statusLogService      // Log status changes
inventoryLogService   // Log stock changes
auditLogService       // Log admin actions

// The 3 Key Methods
logOrderStatusChange()   // Orders, Payments, Refunds
logOrderInventoryChange() // Inventory tracking
logProductCreate/Update/Delete() // Audit trail

// Always include
userId or performedBy   // Who did it
timestamp (auto)        // When it happened
reason/notes (optional) // Why it happened
```

---

## 💡 Pro Tips

1. **Always log changes** - Every status change gets a log entry
2. **Use pagination** - Limit results to 50 per query
3. **Index first** - Create indexes before deployment
4. **Test early** - Write tests as you implement
5. **Monitor always** - Check logs after each deployment
6. **Archive old logs** - Implement cleanup strategy
7. **Document decisions** - Note why you made changes

---

## 🔄 Common Workflows

### Workflow 1: Create Order
```
1. Create Order
2. Log status: null → Pending
3. Log inventory: decrease for each item
4. Update product stock
5. Return order to client
```

### Workflow 2: Cancel Order
```
1. Get current status
2. Update status to Cancelled
3. Log status change
4. Return inventory for each item
5. Log inventory returns
6. Update product stock
```

### Workflow 3: Verify Payment
```
1. Validate payment proof
2. Update payment status
3. Log payment action
4. Update order status
5. Return response
```

### Workflow 4: Delete Product
```
1. Check for references
2. Delete product
3. Log deletion with product data
4. Return success
```

---

## ❓ FAQ Quick Answers

**Q: Do I need new npm packages?**  
A: No. All 17 models use existing MongoDB + Mongoose.

**Q: Will this break existing code?**  
A: No. 100% backward compatible.

**Q: How do I test this?**  
A: See DATABASE_INTEGRATION_GUIDE.md testing section.

**Q: Can I rollback if issues?**  
A: Yes. Stop logging, fix code, resume logging.

**Q: When do I deploy?**  
A: After all tests pass and staging verified.

**Q: How long does integration take?**  
A: 4-6 hours for full implementation.

**Q: What if logs aren't being created?**  
A: Check controller has service imported and called.

---

## 🎯 Your Next Steps

1. Read: **DATABASE_COMPLETE_SUMMARY.md** (5 min)
2. Review: **DATABASE_ARCHITECTURE_v2.0.md** (20 min)
3. Follow: **DATABASE_INTEGRATION_GUIDE.md** (2-3 hours)
4. Track: **DATABASE_IMPLEMENTATION_CHECKLIST.md** (ongoing)
5. Reference: **This file** (as needed)

---

## 📞 Quick Troubleshooting

```javascript
// If models not importing
Check: server/models/index.js has all exports
Fix: Review MODEL_IMPORTS section

// If services not found
Check: server/services/index.js has all exports
Fix: Review SERVICE_IMPORTS section

// If logging not working
Check: Service is imported in controller
Check: Service function is called with correct params
Fix: Add try-catch to see error

// If performance is slow
Check: Indexes created? db.collection.getIndexes()
Fix: Run index creation commands

// If tests fail
Check: Database connection OK?
Check: All models/services accessible?
Fix: Run tests with verbose logging
```

---

**Version**: 1.0 Quick Reference  
**Last Updated**: May 17, 2026  
**Status**: ⚡ Ready to Use

**Keep this handy while implementing!** 🚀
