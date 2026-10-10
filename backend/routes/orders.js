const express = require('express');
const router = express.Router();
const db = require('../data/db');
const eventBus = require('../services/eventBus');

// Helper to calculate / resolve estimated preparation time
function calculateEstimatedPrepTime(order) {
  if (order.estimated_prep_time && typeof order.estimated_prep_time === 'string' && order.estimated_prep_time.trim()) {
    return order.estimated_prep_time;
  }
  let maxPrepMinutes = 8;
  if (order.items && order.items.length) {
    for (const item of order.items) {
      const prod = db.data.products.find(p => p.id === item.product_id);
      const prepStr = prod?.prep_time || item.prep_time || '8 mins';
      const parsed = parseInt(prepStr);
      if (!isNaN(parsed) && parsed > maxPrepMinutes) {
        maxPrepMinutes = parsed;
      }
    }
  }
  const minMinutes = maxPrepMinutes;
  const maxMinutes = maxPrepMinutes + (order.items && order.items.length > 2 ? 4 : 2);
  return `~${minMinutes}–${maxMinutes} mins`;
}

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

  // Ensure every order has estimated_prep_time
  orders.forEach(o => {
    if (!o.estimated_prep_time) {
      o.estimated_prep_time = calculateEstimatedPrepTime(o);
    }
  });

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
  if (!order.estimated_prep_time) {
    order.estimated_prep_time = calculateEstimatedPrepTime(order);
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
    redeem_loyalty_points,
    special_instructions
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
  }

  if (!pickup_slot || !pickup_slot.trim()) {
    return res.status(400).json({ success: false, message: 'Please select a scheduled pickup slot' });
  }

  if (!payment_method || !payment_method.trim()) {
    return res.status(400).json({ success: false, message: 'Please select a payment method' });
  }

  // Step 10 Requirement: Do not create duplicate orders
  // Check if identical order was received within the last 5 seconds from the same user
  const now = Date.now();
  const recentDuplicate = db.data.orders.find(o => 
    o.user_id === (user_id || 'u-101') &&
    (now - new Date(o.created_at).getTime()) < 5000 &&
    o.items && o.items.length === items.length &&
    o.pickup_slot === pickup_slot
  );

  if (recentDuplicate) {
    return res.status(409).json({
      success: false,
      is_duplicate: true,
      message: `Duplicate order detected. Order #${recentDuplicate.id} is already placed.`,
      order: recentDuplicate
    });
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

  // Step 11 Requirement: Simulated Payment & Status (PAID, PENDING, FAILED)
  // For Pay at Counter / Cash: Mark as PENDING
  // For UPI and Card: Mark as PAID (unless explicitly requested as FAILED)
  let resolvedPaymentStatus = 'PAID';
  if (['Cash', 'Cash on Delivery', 'Pay at Counter'].includes(payment_method)) {
    resolvedPaymentStatus = 'PENDING';
  } else if (req.body.payment_status) {
    const rawStatus = String(req.body.payment_status).toUpperCase();
    if (['PAID', 'PENDING', 'FAILED'].includes(rawStatus)) {
      resolvedPaymentStatus = rawStatus;
    }
  }

  // Reject order creation if payment status is FAILED
  if (resolvedPaymentStatus === 'FAILED') {
    return res.status(400).json({
      success: false,
      payment_status: 'FAILED',
      message: 'Simulated payment failed. Order was not created.'
    });
  }

  // Step 11 Requirement: Do not store sensitive card information in plaintext
  let maskedCard = req.body.card_masked || null;
  let cardBrand = req.body.card_brand || null;
  if (!maskedCard && req.body.card_number) {
    const digitsOnly = String(req.body.card_number).replace(/\D/g, '');
    const last4 = digitsOnly.slice(-4) || '1234';
    maskedCard = `•••• •••• •••• ${last4}`;
    cardBrand = digitsOnly.startsWith('4') ? 'Visa' : (digitsOnly.startsWith('5') ? 'Mastercard' : 'RuPay');
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
    payment_status: resolvedPaymentStatus,
    upi_id: req.body.upi_id || (payment_method === 'UPI' ? 'student@okaxis' : null),
    card_masked: maskedCard,
    card_brand: cardBrand,
    order_status: 'Order Placed',
    estimated_prep_time: calculateEstimatedPrepTime({ items: processedItems }),
    pickup_slot: pickup_slot || '12:00 PM – 12:15 PM',
    pickup_counter: pickupCounter,
    special_instructions: special_instructions || '',
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
    const { mongoManager, Order: MongoOrder, OrderItem: MongoOrderItem, LoyaltyTransaction: MongoLT, User: MongoUser } = require('../data/mongo');
    if (mongoManager && mongoManager.isConnected) {
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
    type: 'ORDER_CONFIRMED',
    target: 'student',
    userId: newOrder.user_id,
    icon: 'CONFIRMED',
    title: `Order Confirmed: #${newOrder.id}`,
    message: `Payment successful! Your order #${newOrder.id} has been confirmed. Routed to Counter ${newOrder.pickup_counter}. Slot: ${newOrder.pickup_slot}.`,
    data: { orderId: newOrder.id, token: newOrder.id, counter: newOrder.pickup_counter, legacyType: 'ORDER_PLACED' }
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

  const statusMap = {
    'order placed': 'Order Placed',
    'placed': 'Order Placed',
    'pending': 'Order Placed',
    'confirmed': 'Confirmed',
    'preparing': 'Preparing',
    'ready for pickup': 'Ready for Pickup',
    'ready': 'Ready for Pickup',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };

  const rawKey = (status || '').trim().toLowerCase();
  const normalizedStatus = statusMap[rawKey];

  if (!normalizedStatus) {
    return res.status(400).json({ 
      success: false, 
      message: 'Status must be one of: Order Placed, Confirmed, Preparing, Ready for Pickup, Completed, Cancelled' 
    });
  }

  const oldStatus = order.order_status;
  order.order_status = normalizedStatus;
  order.updated_at = new Date().toISOString();

  // If order was cancelled, restore product stock
  if (normalizedStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
    (order.items || []).forEach(item => {
      const prod = db.data.products.find(p => p.id === item.product_id);
      if (prod) {
        prod.stock += (item.quantity || 1);
        prod.is_available = true;
      }
    });
  }

  // Dynamically update estimated prep time based on status progress
  if (!order.estimated_prep_time) {
    order.estimated_prep_time = calculateEstimatedPrepTime(order);
  }
  if (normalizedStatus === 'Ready for Pickup') {
    order.estimated_prep_time = '0 mins (Ready for Pickup)';
  } else if (normalizedStatus === 'Completed') {
    order.estimated_prep_time = 'Fulfilled';
  } else if (normalizedStatus === 'Preparing') {
    order.estimated_prep_time = '~4–6 mins (In Kitchen Prep)';
  } else if (normalizedStatus === 'Cancelled') {
    order.estimated_prep_time = 'Cancelled';
  }

  // If completed, decrement pending orders count
  if (normalizedStatus === 'Completed' && oldStatus !== 'Completed') {
    db.data.analytics.pending_orders = Math.max(0, db.data.analytics.pending_orders - 1);
  }

  db.saveData();

  // Sync to MongoDB if available
  try {
    const { Order: MongoOrder } = require('../data/mongo');
    if (MongoOrder) {
      await MongoOrder.findOneAndUpdate(
        { id: order.id }, 
        { order_status: normalizedStatus, estimated_prep_time: order.estimated_prep_time, updated_at: order.updated_at }
      );
    }
  } catch (err) {}

  // Determine user friendly icon, title & message for status transition
  let statusIcon = 'PLACED';
  let statusMsg = `Order #${order.id} status is now ${normalizedStatus}.`;
  let eventType = 'ORDER_STATUS_CHANGED';
  let notifTitle = `Order #${order.id}: ${normalizedStatus}`;

  if (normalizedStatus === 'Order Placed') {
    eventType = 'ORDER_PLACED';
    statusIcon = 'PLACED';
    notifTitle = `Order Placed: #${order.id}`;
    statusMsg = `Order #${order.id} has been placed and received by canteen staff.`;
  } else if (normalizedStatus === 'Confirmed') {
    eventType = 'ORDER_CONFIRMED';
    statusIcon = 'CONFIRMED';
    notifTitle = `Order Confirmed: #${order.id}`;
    statusMsg = `Your order #${order.id} is confirmed. Kitchen has queued preparation.`;
  } else if (normalizedStatus === 'Preparing') {
    eventType = 'ORDER_PREPARING';
    statusIcon = 'PREPARING';
    notifTitle = `Order Being Prepared: #${order.id}`;
    statusMsg = `Kitchen is actively preparing your order #${order.id} at Counter ${order.pickup_counter}.`;
  } else if (normalizedStatus === 'Ready for Pickup') {
    eventType = 'ORDER_READY';
    statusIcon = 'READY';
    notifTitle = `Order Ready: #${order.id}`;
    statusMsg = `Order #${order.id} is READY FOR PICKUP at Counter ${order.pickup_counter}! Please show your token #${order.id}.`;
  } else if (normalizedStatus === 'Completed') {
    eventType = 'ORDER_COMPLETED';
    statusIcon = 'COMPLETED';
    notifTitle = `Order Completed: #${order.id}`;
    statusMsg = `Order #${order.id} has been picked up. Thank you for dining with CampusBite!`;
  } else if (normalizedStatus === 'Cancelled') {
    eventType = 'ORDER_CANCELLED';
    statusIcon = 'CANCELLED';
    notifTitle = `Order Cancelled: #${order.id}`;
    statusMsg = `Order #${order.id} was cancelled. Refund credited to CampusPay wallet.`;
  }

  // Broadcast to both Customer and Admin
  eventBus.broadcast({
    type: eventType,
    target: 'all',
    userId: order.user_id,
    icon: statusIcon,
    title: notifTitle,
    message: statusMsg,
    data: { 
      orderId: order.id, 
      status: normalizedStatus, 
      order_status: normalizedStatus,
      counter: order.pickup_counter, 
      estimated_prep_time: order.estimated_prep_time,
      order: order,
      legacyType: 'ORDER_STATUS_CHANGED'
    }
  });

  res.json({
    success: true,
    message: `Order #${order.id} status updated to ${normalizedStatus}`,
    order: order
  });
});

// POST /api/orders/simulate-payment (Step 11 Requirement: Simulated Payment API)
router.post('/simulate-payment', (req, res) => {
  const { payment_method, upi_id, card_number, expiry, cvv, simulate_failure, amount } = req.body;

  if (simulate_failure) {
    return res.status(400).json({
      success: false,
      payment_status: 'FAILED',
      message: 'Simulated payment was declined by the test gateway.'
    });
  }

  if (payment_method === 'UPI') {
    const vpa = (upi_id || '').trim();
    if (!vpa || !vpa.includes('@')) {
      return res.status(400).json({
        success: false,
        payment_status: 'FAILED',
        message: 'Invalid UPI ID format. Please use format like student@bank.'
      });
    }
    return res.json({
      success: true,
      payment_status: 'PAID',
      payment_method: 'UPI',
      upi_id: vpa,
      amount: Number(amount) || 0,
      transaction_id: 'TXN-UPI-' + Date.now(),
      message: 'Simulated UPI payment verified successfully.'
    });
  }

  if (payment_method === 'Card') {
    const rawDigits = String(card_number || '').replace(/\D/g, '');
    if (rawDigits.length < 13 || rawDigits.length > 19) {
      return res.status(400).json({
        success: false,
        payment_status: 'FAILED',
        message: 'Invalid card number length. Must be 13-19 digits.'
      });
    }
    const last4 = rawDigits.slice(-4);
    const masked = `•••• •••• •••• ${last4}`;
    const brand = rawDigits.startsWith('4') ? 'Visa' : (rawDigits.startsWith('5') ? 'Mastercard' : 'RuPay');

    return res.json({
      success: true,
      payment_status: 'PAID',
      payment_method: 'Card',
      card_masked: masked,
      card_brand: brand,
      amount: Number(amount) || 0,
      auth_code: 'AUTH-' + Math.floor(100000 + Math.random() * 900000),
      message: 'Simulated card payment authorized successfully.'
    });
  }

  if (['Cash', 'Cash on Delivery', 'Pay at Counter'].includes(payment_method)) {
    return res.json({
      success: true,
      payment_status: 'PENDING',
      payment_method: 'Cash',
      amount: Number(amount) || 0,
      message: 'Pay at Counter marked as PENDING payment.'
    });
  }

  res.json({
    success: true,
    payment_status: 'PAID',
    payment_method: payment_method || 'UPI',
    amount: Number(amount) || 0,
    message: 'Simulated payment processed successfully.'
  });
});

module.exports = router;
