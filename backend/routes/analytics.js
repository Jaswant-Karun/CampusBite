const express = require('express');
const router = express.Router();
const db = require('../data/db');

// GET full executive business analytics
router.get('/', (req, res) => {
  const products = db.data.products;
  const orders = db.data.orders;
  const reviews = db.data.reviews;

  // Real-time calculation from current order book
  let calculatedTodayRevenue = 0;
  let todayOrdersCount = 0;
  let pendingCount = 0;

  orders.forEach(order => {
    calculatedTodayRevenue += order.total_amount;
    todayOrdersCount += 1;
    if (['Placed', 'Order Placed', 'Confirmed', 'Preparing'].includes(order.order_status)) {
      pendingCount += 1;
    }
  });

  // Calculate stock status alerts
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 10);
  const criticalStockItems = products.filter(p => p.stock <= 2);
  const outOfStockItems = products.filter(p => p.stock === 0 || !p.is_available);

  // Compute item sales ranking
  const itemCounts = {};
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
  });

  const topSelling = Object.keys(itemCounts)
    .map(name => ({
      name,
      sales_count: itemCounts[name],
      revenue: itemCounts[name] * ((products.find(p => p.name === name) || {}).price || 80)
    }))
    .sort((a, b) => b.sales_count - a.sales_count)
    .slice(0, 5);

  res.json({
    success: true,
    kpis: {
      today_revenue: Math.max(db.data.analytics.today_revenue, calculatedTodayRevenue),
      today_orders: Math.max(db.data.analytics.today_orders, todayOrdersCount),
      total_customers: db.data.analytics.total_customers,
      pending_orders: pendingCount || db.data.analytics.pending_orders,
      avg_rating: db.data.analytics.avg_rating,
      low_stock_count: lowStockItems.length,
      critical_stock_count: criticalStockItems.length
    },
    inventory_summary: {
      total_items: products.length,
      low_stock: lowStockItems,
      critical_stock: criticalStockItems,
      out_of_stock: outOfStockItems
    },
    top_selling: topSelling.length ? topSelling : db.data.analytics.top_selling,
    weekly_revenue: db.data.analytics.weekly_revenue,
    orders_by_hour: db.data.analytics.orders_by_hour,
    ratings_breakdown: db.data.analytics.ratings_breakdown
  });
});

module.exports = router;
