/**
 * CampusBite - Customer Management Routes (Step 22)
 * Comprehensive customer CRM, order history aggregation, and diner intelligence.
 */

const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Protect entire customer directory and profiles for admin & staff roles only
router.use(authenticateToken, requireRole(['admin', 'staff']));

// Helper: Normalize phone for loose matching
function cleanPhone(phone) {
  return phone ? String(phone).replace(/\D/g, '') : '';
}

// GET /api/customers - Live customer directory with spending and order history aggregates
router.get('/', (req, res) => {
  const users = db.data.users || [];
  const orders = db.data.orders || [];

  const { search, role, activity, sort } = req.query;

  // Compute live customer profiles with real order history
  let customers = users.map(user => {
    const userCleanPhone = cleanPhone(user.phone);
    const userNameClean = (user.name || '').trim().toLowerCase();

    // Match orders placed by user (by user_id, phone, or name)
    const userOrders = orders.filter(o => {
      if (o.user_id && o.user_id === user.id) return true;
      if (userCleanPhone && o.customer_phone && cleanPhone(o.customer_phone).endsWith(userCleanPhone.slice(-10))) return true;
      if (userNameClean && o.customer_name && o.customer_name.trim().toLowerCase() === userNameClean) return true;
      return false;
    });

    // Sort user orders latest first
    userOrders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Calculate metrics
    const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const lastOrder = userOrders[0] || null;

    // Calculate loyalty tier
    const points = Number(user.loyalty_points) || 0;
    let loyaltyTier = 'Bronze';
    if (points >= 1000) loyaltyTier = 'Platinum';
    else if (points >= 500) loyaltyTier = 'Gold';
    else if (points >= 200) loyaltyTier = 'Silver';

    return {
      id: user.id,
      name: user.name || 'Anonymous Diner',
      email: user.email || '',
      alternate_email: user.alternate_email || '',
      phone: user.phone || '',
      role: user.role || 'student',
      student_id: user.studentId || user.student_id || user.id.toUpperCase(),
      department: user.department || 'Computer Science & Engineering',
      loyalty_points: points,
      loyalty_tier: loyaltyTier,
      wallet_balance: Number(user.wallet_balance) || 0,
      avatar: user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : 'CB'),
      profile_image: user.profile_image || '',
      account_status: user.account_status || 'Active Verified',
      joined_date: user.joined_date || '2024-08-16',
      total_orders: userOrders.length,
      total_spending: Math.round(totalSpent),
      last_order: lastOrder ? {
        id: lastOrder.id,
        created_at: lastOrder.created_at,
        total_amount: lastOrder.total_amount,
        order_status: lastOrder.order_status,
        items_count: (lastOrder.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0)
      } : null,
      last_order_date: lastOrder ? lastOrder.created_at : null
    };
  });

  // Calculate high-level summary KPIs
  const totalCustomersCount = customers.length;
  const activeCustomersCount = customers.filter(c => c.total_orders > 0).length;
  const totalSystemSpend = customers.reduce((sum, c) => sum + c.total_spending, 0);
  const avgSpendingPerCustomer = activeCustomersCount > 0 
    ? Math.round(totalSystemSpend / activeCustomersCount) 
    : 0;

  // Server-side filtering: search
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    customers = customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.student_id.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    );
  }

  // Server-side filtering: role
  if (role && role.toLowerCase() !== 'all') {
    customers = customers.filter(c => (c.role || '').toLowerCase() === role.toLowerCase());
  }

  // Server-side filtering: activity
  if (activity) {
    if (activity === 'active') {
      customers = customers.filter(c => c.total_orders > 0);
    } else if (activity === 'zero') {
      customers = customers.filter(c => c.total_orders === 0);
    } else if (activity === 'vip') {
      customers = customers.filter(c => c.total_spending >= 200);
    }
  }

  // Server-side sorting
  if (sort) {
    if (sort === 'spend_desc') {
      customers.sort((a, b) => b.total_spending - a.total_spending);
    } else if (sort === 'spend_asc') {
      customers.sort((a, b) => a.total_spending - b.total_spending);
    } else if (sort === 'orders_desc') {
      customers.sort((a, b) => b.total_orders - a.total_orders);
    } else if (sort === 'points_desc') {
      customers.sort((a, b) => b.loyalty_points - a.loyalty_points);
    } else if (sort === 'recent_order') {
      customers.sort((a, b) => new Date(b.last_order_date || 0) - new Date(a.last_order_date || 0));
    } else if (sort === 'name_asc') {
      customers.sort((a, b) => a.name.localeCompare(b.name));
    }
  } else {
    // Default sort: highest total spending first
    customers.sort((a, b) => b.total_spending - a.total_spending || b.total_orders - a.total_orders);
  }

  res.json({
    success: true,
    count: customers.length,
    kpis: {
      total_customers: totalCustomersCount,
      active_customers: activeCustomersCount,
      total_spending: totalSystemSpend,
      avg_spending: avgSpendingPerCustomer
    },
    customers
  });
});

// GET /api/customers/:id - Customer details view with full order history
router.get('/:id', (req, res) => {
  const users = db.data.users || [];
  const orders = db.data.orders || [];
  const loyaltyTx = db.data.loyalty_transactions || [];
  const reviews = db.data.reviews || [];

  const customerId = req.params.id;
  const user = users.find(u => u.id === customerId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `Customer ${customerId} not found`
    });
  }

  const userCleanPhone = cleanPhone(user.phone);
  const userNameClean = (user.name || '').trim().toLowerCase();

  // Find all orders placed by this customer
  const userOrders = orders.filter(o => {
    if (o.user_id && o.user_id === user.id) return true;
    if (userCleanPhone && o.customer_phone && cleanPhone(o.customer_phone).endsWith(userCleanPhone.slice(-10))) return true;
    if (userNameClean && o.customer_name && o.customer_name.trim().toLowerCase() === userNameClean) return true;
    return false;
  });

  // Sort orders latest first
  userOrders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  // Find customer loyalty history
  const customerLoyalty = loyaltyTx.filter(lt => lt.user_id === user.id);
  customerLoyalty.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // Find reviews submitted by customer
  const customerReviews = reviews.filter(r => 
    r.user_name && userNameClean && r.user_name.trim().toLowerCase() === userNameClean
  );

  // Compute stats
  const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const avgOrderValue = userOrders.length > 0 ? Math.round(totalSpent / userOrders.length) : 0;

  // Favorite items count
  const itemMap = {};
  userOrders.forEach(o => {
    (o.items || []).forEach(i => {
      const name = i.name || 'Dish';
      itemMap[name] = (itemMap[name] || 0) + (i.quantity || 1);
    });
  });
  const favoriteItems = Object.entries(itemMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const points = Number(user.loyalty_points) || 0;
  let loyaltyTier = 'Bronze';
  if (points >= 1000) loyaltyTier = 'Platinum';
  else if (points >= 500) loyaltyTier = 'Gold';
  else if (points >= 200) loyaltyTier = 'Silver';

  res.json({
    success: true,
    customer: {
      id: user.id,
      name: user.name,
      email: user.email,
      alternate_email: user.alternate_email || '',
      phone: user.phone || '',
      role: user.role || 'student',
      student_id: user.studentId || user.student_id || user.id.toUpperCase(),
      department: user.department || 'Computer Science & Engineering',
      loyalty_points: points,
      loyalty_tier: loyaltyTier,
      wallet_balance: Number(user.wallet_balance) || 0,
      avatar: user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : 'CB'),
      profile_image: user.profile_image || '',
      account_status: user.account_status || 'Active Verified',
      joined_date: user.joined_date || '2024-08-16',
      stats: {
        total_orders: userOrders.length,
        total_spending: Math.round(totalSpent),
        avg_order_value: avgOrderValue,
        last_order_date: userOrders[0] ? userOrders[0].created_at : null
      },
      favorite_items: favoriteItems,
      order_history: userOrders,
      loyalty_history: customerLoyalty,
      reviews: customerReviews
    },
    orders: userOrders
  });
});

module.exports = router;
