const express = require('express');
const router = express.Router();
const db = require('../data/db');
const eventBus = require('../services/eventBus');

// GET all coupons
router.get('/', (req, res) => {
  res.json({
    success: true,
    coupons: db.data.coupons
  });
});

// POST validate and apply coupon
router.post('/apply', (req, res) => {
  const { code, subtotal, already_applied_code } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter a coupon code' });
  }

  const cleanCode = code.trim().toUpperCase();

  // Validate already applied coupon
  if (already_applied_code && already_applied_code.trim().toUpperCase() === cleanCode) {
    return res.status(400).json({ success: false, message: 'This coupon is already applied to your order' });
  }

  const coupon = db.data.coupons.find(c => c.code.toUpperCase() === cleanCode);

  // Validate invalid coupon
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid coupon code. Try CAMPUS20' });
  }

  // Validate active status
  if (!coupon.is_active) {
    return res.status(400).json({ success: false, message: 'This coupon has been deactivated' });
  }

  // Validate expiry date
  if (coupon.expiry_date) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (coupon.expiry_date < todayStr) {
      return res.status(400).json({ success: false, message: `This coupon expired on ${coupon.expiry_date}` });
    }
  }

  const orderAmount = Number(subtotal) || 0;

  // Validate minimum order requirement
  if (orderAmount < coupon.minimum_order) {
    return res.status(400).json({ 
      success: false, 
      coupon: coupon,
      message: `Minimum order amount of ₹${coupon.minimum_order} required for code ${coupon.code}. Add ₹${coupon.minimum_order - orderAmount} more!` 
    });
  }

  // Calculate discount safely (never allow invalid or negative discounts)
  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = Math.round((orderAmount * coupon.discount_value) / 100);
    if (coupon.max_discount) {
      discount = Math.min(discount, coupon.max_discount);
    }
  } else {
    discount = coupon.discount_value;
    if (coupon.max_discount) {
      discount = Math.min(discount, coupon.max_discount);
    }
  }

  // Ensure discount does not exceed the order amount
  discount = Math.max(0, Math.min(discount, orderAmount));

  res.json({
    success: true,
    message: `Promo code ${coupon.code} applied! Saved ₹${discount}`,
    discount: discount,
    final_total: Math.max(0, orderAmount - discount),
    coupon: coupon
  });
});

// POST create new coupon offer (Admin Digital Marketing)
router.post('/', (req, res) => {
  const { code, description, discount_type, discount_value, minimum_order, max_discount, expiry_date, badge } = req.body;

  if (!code || !discount_value) {
    return res.status(400).json({ success: false, message: 'Code and discount value are required' });
  }

  const newCoupon = {
    id: 'c-' + Date.now(),
    code: code.trim().toUpperCase(),
    description: description || `${discount_value}% off campus treat!`,
    discount_type: discount_type || 'percentage',
    discount_value: Number(discount_value),
    minimum_order: Number(minimum_order) || 50,
    max_discount: Number(max_discount) || 50,
    expiry_date: expiry_date || '2026-12-31',
    is_active: true,
    badge: badge || 'Flash Deal'
  };

  db.data.coupons.unshift(newCoupon);
  db.saveData();

  eventBus.broadcast({
    type: 'NEW_OFFER',
    target: 'student',
    icon: '',
    title: `New Deal Drop: ${newCoupon.code}`,
    message: `${newCoupon.description} Use code ${newCoupon.code} to get ${newCoupon.discount_value}% OFF!`,
    data: { coupon: newCoupon }
  });

  res.status(201).json({
    success: true,
    message: `Offer campaign ${newCoupon.code} published!`,
    coupon: newCoupon
  });
});

// PUT toggle coupon active status
router.put('/:id', (req, res) => {
  const coupon = db.data.coupons.find(c => c.id === req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }

  coupon.is_active = req.body.is_active !== undefined ? req.body.is_active : !coupon.is_active;
  db.saveData();

  res.json({
    success: true,
    message: `Coupon status updated`,
    coupon: coupon
  });
});

// DELETE remove coupon (Admin)
router.delete('/:id', (req, res) => {
  const index = db.data.coupons.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }

  const removed = db.data.coupons.splice(index, 1)[0];
  db.saveData();

  res.json({
    success: true,
    message: `Coupon ${removed.code} deleted successfully`,
    coupon: removed
  });
});

module.exports = router;
