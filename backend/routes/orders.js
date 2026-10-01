const express = require('express');
const router = express.Router();
const db = require('../data/db');

// GET all orders (with optional filters)
router.get('/', (req, res) => {
  let orders = [...db.data.orders];
  const { user_id, status } = req.query;

  if (user_id) {
    orders = orders.filter(o => o.user_id === user_id);
  }

  if (status && status !== 'All') {
    orders = orders.filter(o => o.order_status.toLowerCase() === status.toLowerCase());
  }

  // Sort latest first
  orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    success: true,
    count: orders.length,
    orders: orders
  });
});

// GET single order by ID
router.get('/:id', (req, res) => {
  const order = db.data.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({ success: true, order });
});

// POST create new order (Student Checkout with Simulated Payment)
router.post('/', (req, res) => {
  const { 
    user_id, 
    customer_name, 
    customer_phone, 
    items, 
    coupon_code, 
    payment_method, 
    pickup_slot,
    redeem_loyalty_points
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
  }

  // Calculate Subtotal & Validate Stock
  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const product = db.data.products.find(p => p.id === item.product_id);
    if (!product) {
      return res.status(400).json({ success: false, message: `Product ${item.product_id} not found` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock for ${product.name}. Only ${product.stock} available.` 
      });
    }

    // Deduct stock
    product.stock -= item.quantity;
    if (product.stock <= 0) {
      product.stock = 0;
      product.is_available = false;
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;
    processedItems.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image_emoji: product.image_emoji
    });
  }

  // Calculate Coupon Discount
  let discount = 0;
  let appliedCoupon = null;

  if (coupon_code) {
    const coupon = db.data.coupons.find(c => 
      c.code.toUpperCase() === coupon_code.toUpperCase() && c.is_active
    );
    if (coupon) {
      if (subtotal >= coupon.minimum_order) {
        if (coupon.discount_type === 'percentage') {
          discount = Math.min(Math.round((subtotal * coupon.discount_value) / 100), coupon.max_discount || 100);
        } else {
          discount = Math.min(coupon.discount_value, subtotal);
        }
        appliedCoupon = coupon.code;
      }
    }
  }

  // Loyalty Points Discount
  let loyaltyDiscount = 0;
  const user = db.data.users.find(u => u.id === user_id);
  if (redeem_loyalty_points && user && user.loyalty_points >= 100) {
    loyaltyDiscount = Math.min(Math.floor(user.loyalty_points / 100) * 10, subtotal - discount);
    const pointsUsed = (loyaltyDiscount / 10) * 100;
    user.loyalty_points -= pointsUsed;

    db.data.loyalty_transactions.unshift({
      id: 'lt-' + Date.now(),
      user_id: user.id,
      points: -pointsUsed,
      type: 'redeemed',
      description: `Redeemed ${pointsUsed} pts for ₹${loyaltyDiscount} discount`,
      date: new Date().toISOString()
    });
  }

  const totalDiscount = discount + loyaltyDiscount;
  const finalAmount = Math.max(0, subtotal - totalDiscount);

  // Generate order number #CB10xx
  const currentCount = db.data.orders.length;
  const orderNumber = `CB${1027 + currentCount}`;

  // Assign pickup counter (1, 2, or 3)
  const pickupCounter = (currentCount % 3) + 1;

  // Calculate earned loyalty points (1 pt per ₹10 spent)
  const pointsEarned = Math.floor(finalAmount / 10);
  if (user) {
    user.loyalty_points = (user.loyalty_points || 0) + pointsEarned;
    db.data.loyalty_transactions.unshift({
      id: 'lt-' + (Date.now() + 1),
      user_id: user.id,
      points: pointsEarned,
      type: 'earned',
      description: `Order #${orderNumber} purchase reward`,
      date: new Date().toISOString()
    });
  }

  const newOrder = {
    id: orderNumber,
    user_id: user_id || 'u-101',
    customer_name: customer_name || (user ? user.name : 'Student'),
    customer_phone: customer_phone || (user ? user.phone : '+91 98765 43210'),
    items: processedItems,
    subtotal: subtotal,
    discount: totalDiscount,
    coupon_code: appliedCoupon,
    total_amount: finalAmount,
    payment_method: payment_method || 'UPI',
    payment_status: payment_method === 'Cash' ? 'Pending (Pay at Counter)' : 'Paid (Simulated)',
    order_status: 'Placed',
    pickup_slot: pickup_slot || 'Within 10-15 mins',
    pickup_counter: pickupCounter,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    loyalty_points_earned: pointsEarned
  };

  db.data.orders.unshift(newOrder);

  // Update overall analytics
  db.data.analytics.today_revenue += finalAmount;
  db.data.analytics.today_orders += 1;
  db.data.analytics.pending_orders += 1;

  db.saveData();

  res.status(201).json({
    success: true,
    message: 'Order placed successfully! Skip the queue with your pickup token.',
    order: newOrder,
    loyalty_points_earned: pointsEarned
  });
});

// PUT update order status (Admin workflow)
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const order = db.data.orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const validStatuses = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const oldStatus = order.order_status;
  order.order_status = status;
  order.updated_at = new Date().toISOString();

  // If completed, decrement pending orders count
  if (status === 'Completed' && oldStatus !== 'Completed') {
    db.data.analytics.pending_orders = Math.max(0, db.data.analytics.pending_orders - 1);
  }

  db.saveData();

  res.json({
    success: true,
    message: `Order #${order.id} status updated to ${status}`,
    order: order
  });
});

module.exports = router;
