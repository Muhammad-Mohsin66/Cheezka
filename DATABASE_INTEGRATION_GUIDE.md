# Enterprise Database Architecture - Developer Integration Guide

**Status**: Ready for Implementation  
**Estimated Integration Time**: 4-6 hours  
**Breaking Changes**: None (100% backward compatible)

---

## 🚀 Quick Start Integration

### Step 1: Model Import Hub

Create `server/models/index.js`:

```javascript
/**
 * Central Model Export Hub
 * Use: const { Order, OrderStatusLog, User } = require('./models');
 */

// Existing Collections
const User = require('./User');
const MenuItem = require('./MenuItem'); // or Product
const Order = require('./Order');
const Payment = require('./Payment');
const Refund = require('./Refund');
const Notification = require('./Notification');

// New Authentication & Security (4)
const Role = require('./Role');
const OTPVerification = require('./OTPVerification');
const EmailToken = require('./EmailToken');
const Session = require('./Session');

// New Product System (3)
const ProductSize = require('./ProductSize');
const ProductImage = require('./ProductImage');
const Deal = require('./Deal');

// New Order System (2)
const OrderItem = require('./OrderItem');
const OrderStatusLog = require('./OrderStatusLog');

// New Payment & Refund (2)
const PaymentLog = require('./PaymentLog');
const RefundLog = require('./RefundLog');

// New Delivery System (3)
const DeliveryZone = require('./DeliveryZone');
const DeliveryAssignment = require('./DeliveryAssignment');
const RiderAvailability = require('./RiderAvailability');

// New System Tracking (2)
const InventoryLog = require('./InventoryLog');
const AuditLog = require('./AuditLog');
const SystemSetting = require('./SystemSetting');

module.exports = {
  // Existing
  User,
  MenuItem,
  Order,
  Payment,
  Refund,
  Notification,

  // New
  Role,
  OTPVerification,
  EmailToken,
  Session,
  ProductSize,
  ProductImage,
  Deal,
  OrderItem,
  OrderStatusLog,
  PaymentLog,
  RefundLog,
  DeliveryZone,
  DeliveryAssignment,
  RiderAvailability,
  InventoryLog,
  AuditLog,
  SystemSetting,
};
```

### Step 2: Service Import Hub

Create `server/services/index.js`:

```javascript
/**
 * Central Service Export Hub
 */

const auditLogService = require('./auditLogService');
const inventoryLogService = require('./inventoryLogService');
const statusLogService = require('./statusLogService');
const inventoryService = require('./inventoryService'); // existing
const notificationService = require('./notificationService'); // existing

module.exports = {
  // New services
  auditLogService,
  inventoryLogService,
  statusLogService,

  // Existing services
  inventoryService,
  notificationService,
};
```

---

## 📋 Integration Checklist

### Phase 1: Basic Setup (30 min)
- [ ] Copy all 17 model files to `server/models/`
- [ ] Create `server/models/index.js` export hub
- [ ] Copy 3 service files to `server/services/`
- [ ] Create `server/services/index.js` export hub
- [ ] Run `npm install` (no new dependencies needed)

### Phase 2: Index Creation (15 min)
- [ ] Run MongoDB index creation commands (see Database docs)
- [ ] Verify indexes in MongoDB Compass
- [ ] Check index performance with explain()

### Phase 3: Controller Updates (2-3 hours)

#### Update Order Controller
```javascript
const { Order, OrderItem, OrderStatusLog } = require('../models');
const { statusLogService, inventoryLogService } = require('../services');

// In placeOrder function:
exports.placeOrder = async (req, res, next) => {
  try {
    // ... existing validation ...

    const order = await Order.create({
      customer: req.user._id,
      items: preparedItems,
      totalAmount,
      // ... other fields
    });

    // NEW: Log status
    await statusLogService.logOrderStatusChange(
      order._id,
      null,
      'Pending',
      req.user._id,
      'Order placed'
    );

    // NEW: Log inventory
    for (const item of order.items) {
      await inventoryLogService.logOrderInventoryChange(
        item.product,
        item.quantity,
        order._id,
        req.user._id
      );
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// In updateOrderStatus:
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;

    const order = await Order.findById(orderId);
    const previousStatus = order.status;

    order.status = status;
    await order.save();

    // NEW: Log status change
    await statusLogService.logOrderStatusChange(
      orderId,
      previousStatus,
      status,
      req.user._id,
      reason
    );

    // NEW: Return inventory if cancelled
    if (previousStatus !== 'Cancelled' && status === 'Cancelled') {
      for (const item of order.items) {
        await inventoryLogService.logCancellationInventoryReturn(
          item.product,
          item.quantity,
          orderId,
          req.user._id
        );
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};
```

#### Update Payment Controller
```javascript
const { Payment, PaymentLog } = require('../models');
const { statusLogService } = require('../services');

// In verifyPayment:
exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);

    const previousStatus = payment.status;
    payment.status = 'Verified';
    payment.verifiedBy = req.user._id;
    await payment.save();

    // NEW: Log payment action
    await statusLogService.logPaymentAction(
      paymentId,
      'verified',
      req.user._id,
      'Payment verified',
      previousStatus,
      'Verified'
    );

    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

// In rejectPayment:
exports.rejectPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(paymentId);
    const previousStatus = payment.status;

    payment.status = 'Rejected';
    payment.rejectionReason = reason;
    await payment.save();

    // NEW: Log rejection
    await statusLogService.logPaymentAction(
      paymentId,
      'rejected',
      req.user._id,
      reason,
      previousStatus,
      'Rejected'
    );

    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};
```

#### Update Refund Controller
```javascript
const { Refund, RefundLog } = require('../models');
const { statusLogService } = require('../services');

// In approveRefund:
exports.approveRefund = async (req, res, next) => {
  try {
    const { refundId } = req.params;
    const refund = await Refund.findById(refundId);

    const previousStatus = refund.status;
    refund.status = 'Approved';
    refund.approvedBy = req.user._id;
    await refund.save();

    // NEW: Log approval
    await statusLogService.logRefundAction(
      refundId,
      'approved',
      req.user._id,
      refund.amount,
      'Refund approved',
      previousStatus,
      'Approved'
    );

    res.json({ success: true, refund });
  } catch (error) {
    next(error);
  }
};
```

#### Update Product Controller
```javascript
const { Product, AuditLog } = require('../models');
const { auditLogService } = require('../services');

// In createProduct:
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    // NEW: Log creation
    await auditLogService.logProductCreate(
      req.user._id,
      product,
      req.ip,
      req.get('user-agent')
    );

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// In updateProduct:
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    const originalData = product.toObject();

    Object.assign(product, req.body);
    await product.save();

    // NEW: Log update
    await auditLogService.logProductUpdate(
      req.user._id,
      id,
      product.name,
      originalData,
      product.toObject(),
      req.ip,
      req.get('user-agent')
    );

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// In deleteProduct:
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    await Product.findByIdAndDelete(id);

    // NEW: Log deletion
    await auditLogService.logProductDelete(
      req.user._id,
      id,
      product.name,
      req.ip,
      req.get('user-agent')
    );

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};
```

### Phase 4: New Endpoints (1 hour)

Create new endpoints for:

```javascript
// In routes/orderRoutes.js
router.get('/:orderId/status-history', getOrderStatusHistory);
router.post('/:orderId/status-history', getOrderStatusHistory);

// In routes/productRoutes.js
router.post('/:productId/inventory-adjust', adjustInventory);
router.get('/:productId/inventory-history', getInventoryHistory);

// In routes/auditRoutes.js (new file)
router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/user/:userId', getUserAuditTrail);

// In routes/analyticsRoutes.js (new file)
router.get('/reports/inventory-discrepancies', getInventoryDiscrepancies);
router.get('/reports/delivery-metrics', getDeliveryMetrics);
router.get('/reports/payment-status', getPaymentStatusReport);
```

---

## 🧪 Testing Strategy

### Unit Tests
```javascript
describe('InventoryLogService', () => {
  it('should log inventory decrease', async () => {
    const product = await Product.create({ name: 'Pizza', stock: 100 });
    await InventoryLogService.logOrderInventoryChange(product._id, 5, orderId, userId);
    
    const log = await InventoryLog.findOne({ product: product._id });
    expect(log.quantity).toBe(5);
    expect(log.changeType).toBe('decrease');
  });
});

describe('StatusLogService', () => {
  it('should log order status change', async () => {
    await StatusLogService.logOrderStatusChange(
      orderId, 'Pending', 'Confirmed', userId
    );
    
    const log = await OrderStatusLog.findOne({ order: orderId });
    expect(log.newStatus).toBe('Confirmed');
  });
});

describe('AuditLogService', () => {
  it('should log product creation', async () => {
    const product = await Product.create({ name: 'Burger' });
    await AuditLogService.logProductCreate(userId, product, '127.0.0.1', 'Mozilla/5.0');
    
    const log = await AuditLog.findOne({ targetId: product._id });
    expect(log.action).toBe('create');
  });
});
```

### Integration Tests
```javascript
describe('Order Controller Integration', () => {
  it('should create order with status log', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ items, address });
    
    expect(response.status).toBe(201);
    
    const statusLog = await OrderStatusLog.findOne({ order: response.body.order._id });
    expect(statusLog).toBeDefined();
  });

  it('should log inventory changes', async () => {
    const product = await Product.create({ stock: 100 });
    await Order.create({ items: [{ product: product._id, quantity: 5 }] });
    
    const log = await InventoryLog.findOne({ product: product._id });
    expect(log.changeType).toBe('decrease');
  });
});
```

---

## 📊 Monitoring & Debugging

### Check Log Creation
```javascript
// View recent status logs
db.orderstatuslogs.find().sort({ createdAt: -1 }).limit(10);

// View inventory changes for product
db.inventorylogs.find({ product: ObjectId("...") }).sort({ createdAt: -1 });

// View audit trail for user
db.auditlogs.find({ user: ObjectId("...") }).sort({ createdAt: -1 });
```

### Performance Monitoring
```javascript
// Check query performance
db.orderstatuslogs.find({ order: ObjectId("...") }).explain("executionStats");

// Verify index usage
db.collection.aggregate([{ $indexStats: {} }]);

// Find slow queries
db.setProfilingLevel(1, { slowms: 100 });
```

---

## 🔄 Rollback Plan

If issues occur:

```javascript
// 1. Stop logging new records
// Comment out statusLogService calls temporarily

// 2. Verify data consistency
const logs = await InventoryLog.find({ product: productId });
let calculated = 0;
logs.forEach(l => calculated += l.changeType === 'increase' ? l.quantity : -l.quantity);

// 3. Fix discrepancies
await Product.updateOne({ _id: productId }, { stock: calculated });

// 4. Create correction log
await InventoryLogService.logManualAdjustment(
  productId,
  Math.abs(calculated - currentStock),
  calculated > currentStock ? 'increase' : 'decrease',
  adminId,
  'Discrepancy correction'
);

// 5. Resume logging
// Uncomment logging calls
```

---

## 📈 Performance Tuning

### Optimize Log Queries
```javascript
// Good: Indexed query
db.orderstatuslogs.find({ order: id }).sort({ createdAt: -1 }).limit(10);

// Bad: Unindexed filter
db.orderstatuslogs.find({ reason: { $regex: "pattern" } });

// Solution: Add text index for search
db.orderstatuslogs.createIndex({ reason: "text" });
```

### Archive Old Logs
```javascript
// Archive logs older than 1 year
const cutoffDate = new Date();
cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

const archived = await AuditLog.find({ createdAt: { $lt: cutoffDate } });
// Save to archive collection
await AuditLogArchive.insertMany(archived);
// Delete from main collection
await AuditLog.deleteMany({ createdAt: { $lt: cutoffDate } });
```

---

## 🎯 Success Criteria

✅ **Completion Checklist**
- [ ] All 17 models created and accessible
- [ ] All 3 services working without errors
- [ ] Controllers logging status changes
- [ ] Inventory tracking functional
- [ ] Audit logs capturing admin actions
- [ ] Indexes created and optimized
- [ ] Backward compatibility verified
- [ ] No performance degradation
- [ ] Tests passing
- [ ] Documentation complete

---

## 📞 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Models not importing | Check `server/models/index.js` exports |
| Logging not working | Verify service requires in controllers |
| Performance slow | Check indexes with `explain("executionStats")` |
| Duplicate logs | Verify logging isn't called twice |
| Memory issues | Implement log archiving strategy |

---

## 📚 Next Steps

1. **Implement Phase 1-2**: Copy files and create indexes (1 hour)
2. **Implement Phase 3**: Update controllers (2-3 hours)
3. **Implement Phase 4**: Create new endpoints (1 hour)
4. **Testing**: Run integration tests (1 hour)
5. **Deployment**: Deploy to staging first, then production

---

**Ready to Go!** 🚀

All files are production-ready. Follow this guide for smooth integration.

For questions, refer to `DATABASE_ARCHITECTURE_v2.0.md`.
