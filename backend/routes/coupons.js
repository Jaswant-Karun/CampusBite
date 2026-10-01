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
  const { code, subtotal } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Please enter a coupon code' });
  }

  const coupon = db.data.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid coupon code. Try CAMPUS20' });
  }

  if (!coupon.is_active) {
    return res.status(400).json({ success: false, message: 'This coupon has expired or is deactivated' });
  }

  const orderAmount = Number(subtotal) || 0;
  if (orderAmount < coupon.minimum_order) {
    if (orderAmount === 0) {
      return res.json({
        success: true,
        preapplied: true,
        message: `Offer code ${coupon.code} activated! 20% OFF will apply automatically when your tray reaches ₹${coupon.minimum_order}.`,
        discount: 0,
        coupon: coupon
      });
    }
    return res.status(400).json({ 
      success: false, 
      coupon: coupon,
      message: `Minimum order amount of ₹${coupon.minimum_order} required for code ${coupon.code}. Add ₹${coupon.minimum_order - orderAmount} more!` 
    });
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = Math.min(Math.round((orderAmount * coupon.discount_value) / 100), coupon.max_discount || 100);
  } else {
    discount = Math.min(coupon.discount_value, orderAmount);
  }

  res.json({
    success: true,
    message: `Promo code ${coupon.code} applied! Saved ₹${discount}`,
    discount: discount,
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
    badge: badge || '⚡ Flash Deal'
  };

  db.data.coupons.unshift(newCoupon);
  db.saveData();

  eventBus.broadcast({
    type: 'NEW_OFFER',
    target: 'student',
    icon: '🏷️',
    title: `🔥 New Deal Drop: ${newCoupon.code}`,
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

module.exports = router;
