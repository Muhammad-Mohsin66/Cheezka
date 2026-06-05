const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Product = require('../models/Product');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * GET /api/reports/dashboard
 * Dashboard summary with key metrics
 */
exports.getDashboardSummary = async (req, res) => {
  // 1. Total Orders
  const totalOrdersResult = await Order.aggregate([
    {
      $count: 'total',
    },
  ]);
  const totalOrders = totalOrdersResult[0]?.total || 0;

  // 2. Total Revenue (Verified payments + Delivered orders)
  const totalRevenueResult = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'Verified',
        orderStatus: 'Delivered',
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$grandTotal' },
      },
    },
  ]);
  const totalRevenue = totalRevenueResult[0]?.revenue || 0;

  // 3. Total Refund Amount (Processed refunds)
  const totalRefundResult = await Refund.aggregate([
    {
      $match: {
        status: 'Processed',
      },
    },
    {
      $group: {
        _id: null,
        totalRefunded: { $sum: '$amount' },
      },
    },
  ]);
  const totalRefundAmount = totalRefundResult[0]?.totalRefunded || 0;

  // 4. Total Unique Customers
  const totalCustomersResult = await Order.aggregate([
    {
      $group: {
        _id: '$customer',
      },
    },
    {
      $count: 'total',
    },
  ]);
  const totalCustomers = totalCustomersResult[0]?.total || 0;

  // 5. Pending Orders
  const pendingOrdersResult = await Order.aggregate([
    {
      $match: {
        orderStatus: { $in: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Assigned to Rider', 'Handover to Rider'] },
      },
    },
    {
      $count: 'total',
    },
  ]);
  const pendingOrders = pendingOrdersResult[0]?.total || 0;

  // 6. Low Stock Products Count
  const lowStockResult = await Product.aggregate([
    {
      $match: {
        $or: [
          { stockQuantity: { $lte: '$lowStockThreshold' } },
          { isOutOfStock: true },
        ],
      },
    },
    {
      $count: 'total',
    },
  ]);
  const lowStockProducts = lowStockResult[0]?.total || 0;

  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      totalRevenue,
      totalRefundAmount,
      totalCustomers,
      pendingOrders,
      lowStockProducts,
    },
  });
};

/**
 * GET /api/reports/revenue?type=daily|weekly|monthly
 * Revenue report grouped by period
 */
exports.getRevenueReport = async (req, res) => {
  const { type = 'monthly' } = req.query;

  // Validate type
  if (!['daily', 'weekly', 'monthly'].includes(type)) {
    throw new AppError('Type must be daily, weekly, or monthly', 400);
  }

  let groupByFormat;

  if (type === 'daily') {
    groupByFormat = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' },
    };
  } else if (type === 'weekly') {
    groupByFormat = {
      year: { $year: '$createdAt' },
      week: { $week: '$createdAt' },
    };
  } else {
    // monthly
    groupByFormat = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
    };
  }

  const revenueData = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'Verified',
        orderStatus: 'Delivered',
      },
    },
    {
      $group: {
        _id: groupByFormat,
        totalRevenue: { $sum: '$grandTotal' },
        orderCount: { $sum: 1 },
        averageOrderValue: { $avg: '$grandTotal' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      type,
      report: revenueData,
    },
  });
};

/**
 * GET /api/reports/most-selling
 * Top 5 most selling products
 */
exports.getMostSellingProducts = async (req, res) => {
  const mostSellingData = await Order.aggregate([
    {
      $match: {
        orderStatus: 'Delivered',
      },
    },
    {
      $unwind: '$orderItems',
    },
    {
      $group: {
        _id: '$orderItems.product',
        productName: { $first: '$orderItems.name' },
        totalQuantity: { $sum: '$orderItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] } },
        averagePrice: { $avg: '$orderItems.price' },
      },
    },
    {
      $sort: { totalQuantity: -1 },
    },
    {
      $limit: 5,
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails',
      },
    },
    {
      $project: {
        _id: 1,
        productName: 1,
        totalQuantity: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        averagePrice: { $round: ['$averagePrice', 2] },
        stockQuantity: { $arrayElemAt: ['$productDetails.stockQuantity', 0] },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: mostSellingData,
  });
};

/**
 * GET /api/reports/refunds
 * Refund report with status breakdown
 */
exports.getRefundReport = async (req, res) => {
  // Total refunds and amount by status
  const refundData = await Refund.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Overall refund statistics
  const overallStats = await Refund.aggregate([
    {
      $group: {
        _id: null,
        totalRefunds: { $sum: 1 },
        totalRefundedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Processed'] }, '$amount', 0],
          },
        },
        totalPendingAmount: {
          $sum: {
            $cond: [{ $in: ['$status', ['Requested', 'Approved']] }, '$amount', 0],
          },
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      overallStats: overallStats[0] || {
        totalRefunds: 0,
        totalRefundedAmount: 0,
        totalPendingAmount: 0,
      },
      byStatus: refundData,
    },
  });
};

/**
 * GET /api/reports/inventory-alerts
 * Low stock and out of stock products
 */
exports.getInventoryAlerts = async (req, res) => {
  // Low stock products
  const lowStockProducts = await Product.aggregate([
    {
      $match: {
        $and: [
          { stockQuantity: { $lte: '$lowStockThreshold' } },
          { isOutOfStock: false },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        stockQuantity: 1,
        lowStockThreshold: 1,
        basePrice: 1,
        status: 'LOW_STOCK',
      },
    },
    {
      $sort: { stockQuantity: 1 },
    },
  ]);

  // Out of stock products
  const outOfStockProducts = await Product.aggregate([
    {
      $match: {
        isOutOfStock: true,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        stockQuantity: 1,
        lowStockThreshold: 1,
        basePrice: 1,
        status: 'OUT_OF_STOCK',
      },
    },
    {
      $sort: { name: 1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts,
      outOfStockProducts,
    },
  });
};

/**
 * GET /api/reports/payment-breakdown
 * Payment method breakdown with amounts
 */
exports.getPaymentMethodBreakdown = async (req, res) => {
  const paymentBreakdown = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'Verified',
      },
    },
    {
      $group: {
        _id: '$paymentMethod',
        orderCount: { $sum: 1 },
        totalAmount: { $sum: '$grandTotal' },
        averageOrderValue: { $avg: '$grandTotal' },
      },
    },
    {
      $sort: { orderCount: -1 },
    },
    {
      $project: {
        _id: 1,
        paymentMethod: '$_id',
        orderCount: 1,
        totalAmount: { $round: ['$totalAmount', 2] },
        averageOrderValue: { $round: ['$averageOrderValue', 2] },
        percentage: {
          $round: [
            {
              $multiply: [
                {
                  $divide: [
                    '$orderCount',
                    {
                      $sum: [
                        { $cond: [{ $eq: ['$_id', 'COD'] }, '$orderCount', 0] },
                        { $cond: [{ $eq: ['$_id', 'Online'] }, '$orderCount', 0] },
                      ],
                    },
                  ],
                },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
  ]);

  // Calculate total for percentage if no breakdown exists
  const totalOrdersVerified = await Order.aggregate([
    {
      $match: { paymentStatus: 'Verified' },
    },
    {
      $count: 'total',
    },
  ]);

  // Recalculate with actual totals
  const paymentBreakdownFixed = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'Verified',
      },
    },
    {
      $group: {
        _id: '$paymentMethod',
        orderCount: { $sum: 1 },
        totalAmount: { $sum: '$grandTotal' },
        averageOrderValue: { $avg: '$grandTotal' },
      },
    },
    {
      $facet: {
        breakdown: [
          { $sort: { orderCount: -1 } },
          {
            $project: {
              paymentMethod: '$_id',
              orderCount: 1,
              totalAmount: { $round: ['$totalAmount', 2] },
              averageOrderValue: { $round: ['$averageOrderValue', 2] },
              _id: 0,
            },
          },
        ],
        totals: [
          {
            $group: {
              _id: null,
              totalOrders: { $sum: '$orderCount' },
              totalRevenue: { $sum: '$totalAmount' },
            },
          },
        ],
      },
    },
  ]);

  const breakdownData = paymentBreakdownFixed[0]?.breakdown || [];
  const totals = paymentBreakdownFixed[0]?.totals[0] || { totalOrders: 0, totalRevenue: 0 };

  // Add percentage to each breakdown
  const breakdownWithPercentage = breakdownData.map((item) => ({
    ...item,
    percentage:
      totals.totalOrders > 0
        ? parseFloat(((item.orderCount / totals.totalOrders) * 100).toFixed(2))
        : 0,
  }));

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalOrders: totals.totalOrders,
        totalRevenue: parseFloat(totals.totalRevenue?.toFixed(2) || 0),
      },
      breakdown: breakdownWithPercentage,
    },
  });
};
