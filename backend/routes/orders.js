const express = require('express');
const router = express.Router();
const db = require('../data/db');
const eventBus = require('../services/eventBus');

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
router.post('/', async (req, res) => {
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

  // Sync to MongoDB if available
  try {
    const { Order: MongoOrder, OrderItem: MongoOrderItem, LoyaltyTransaction: MongoLT, User: MongoUser } = require('../data/mongo');
    if (MongoOrder) {
      await MongoOrder.create(newOrder);
    }
    if (MongoOrderItem && processedItems.length) {
      const itemsToInsert = processedItems.map(item => ({
        id: 'oi-' + Math.random().toString(36).substring(2, 9),
        order_id: newOrder.id,
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customization: item.customization,
        image_emoji: item.image_emoji,
        total_price: item.price * item.quantity
      }));
      await MongoOrderItem.insertMany(itemsToInsert);
    }
    if (MongoLT && pointsEarned > 0 && user) {
      await MongoLT.create({
        id: 'lt-' + (Date.now() + 1),
        user_id: user.id,
        points: pointsEarned,
        type: 'earned',
        description: `Order #${newOrder.id} purchase reward`,
        date: new Date().toISOString()
      });
    }
    if (MongoUser && user) {
      await MongoUser.updateOne({ id: user.id }, { $set: { loyalty_points: user.loyalty_points } });
    }
  } catch (err) {}

  // 1. Broadcast live notification to Admin Kitchen Kanban
  eventBus.broadcast({
    type: 'NEW_ORDER',
    target: 'admin',
    icon: '',
    title: `New Order #${newOrder.id} Placed!`,
    message: `${newOrder.customer_name} placed an order for ₹${newOrder.total_amount} (${newOrder.items.length} items). Routed to Counter ${newOrder.pickup_counter}.`,
    data: { orderId: newOrder.id, order: newOrder, counter: newOrder.pickup_counter }
  });

  // 2. Broadcast live notification to Student / Customer
  eventBus.broadcast({
    type: 'ORDER_PLACED',
    target: 'student',
    userId: newOrder.user_id,
    icon: '',
    title: `Order Confirmed: Token #${newOrder.id}`,
    message: `Payment successful! Your order has reached Counter ${newOrder.pickup_counter}. Slot: ${newOrder.pickup_slot}.`,
    data: { orderId: newOrder.id, token: newOrder.id, counter: newOrder.pickup_counter }
  });

  // 3. Check for low stock alerts on affected items
  for (const item of processedItems) {
    const p = db.data.products.find(prod => prod.id === item.product_id);
    if (p && p.stock <= 3) {
      eventBus.broadcast({
        type: 'LOW_STOCK',
        target: 'admin',
        icon: '',
        title: `Low Stock Alert: ${p.name}`,
        message: `Only ${p.stock} units remaining in stock. Consider restocking soon.`,
        data: { productId: p.id, stock: p.stock }
      });
    }
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully! Skip the queue with your pickup token.',
    order: newOrder,
    loyalty_points_earned: pointsEarned
  });
});

// PUT update order status (Admin workflow)
router.put('/:id/status', async (req, res) => {
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

  // Sync to MongoDB if available
  try {
    const { Order: MongoOrder } = require('../data/mongo');
    if (MongoOrder) {
      await MongoOrder.findOneAndUpdate({ id: order.id }, { order_status: status, updated_at: order.updated_at });
    }
  } catch (err) {}

  // Determine user friendly icon & message for status transition
  let statusIcon = 'PLACED';
  let statusMsg = `Order #${order.id} status is now ${status}.`;

  if (status === 'Preparing') {
    statusIcon = 'PREPARING';
    statusMsg = `Kitchen is actively preparing Order #${order.id} at Counter ${order.pickup_counter}.`;
  } else if (status === 'Ready') {
    statusIcon = 'READY';
    statusMsg = `Order #${order.id} is READY FOR PICKUP at Counter ${order.pickup_counter}! Show your token #${order.id}.`;
  } else if (status === 'Completed') {
    statusIcon = 'COMPLETED';
    statusMsg = `Order #${order.id} has been picked up. Thank you for dining with CampusBite!`;
  } else if (status === 'Cancelled') {
    statusIcon = 'CANCELLED';
    statusMsg = `Order #${order.id} was cancelled. Refund credited to CampusPay wallet.`;
  }

  // Broadcast to both Customer and Admin
  eventBus.broadcast({
    type: 'ORDER_STATUS_CHANGED',
    target: 'all',
    userId: order.user_id,
    icon: statusIcon,
    title: `Order #${order.id}: ${status}`,
    message: statusMsg,
    data: { orderId: order.id, status: status, counter: order.pickup_counter, order: order }
  });

  res.json({
    success: true,
    message: `Order #${order.id} status updated to ${status}`,
    order: order
  });
});

module.exports = router;
