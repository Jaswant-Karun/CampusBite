/**
 * CampusBite - Coupon & Discount Management Routes (Step 23)
 * Full Admin CRUD for Coupons, Expiry Enforcement, Minimum Order & Maximum Discount Rules
 */

const express = require('express');
const router = express.Router();
const db = require('../data/db');
const eventBus = require('../services/eventBus');

// Helper: Get today's date in YYYY-MM-DD
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// GET all coupons (includes active, expired, and deactivated coupons)
router.get('/', (req, res) => {
  const todayStr = getTodayStr();
  const coupons = (db.data.coupons || []).map(c => ({
    ...c,
    is_expired: c.expiry_date ? c.expiry_date < todayStr : false
  }));

  res.json({
    success: true,
    count: coupons.length,
    coupons
  });
});

// GET single coupon by ID
router.get('/:id', (req, res) => {
  const coupon = (db.data.coupons || []).find(c => c.id === req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }

  const todayStr = getTodayStr();
  res.json({
    success: true,
    coupon: {
      ...coupon,
      is_expired: coupon.expiry_date ? coupon.expiry_date < todayStr : false
    }
  });
});

// POST validate and apply coupon (Student Cart & Checkout)
router.post('/apply', (req, res) => {
  const { code, subtotal, order_amount, already_applied_code } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter a coupon code' });
  }

  const cleanCode = code.trim().toUpperCase();

  // Validate already applied coupon
  if (already_applied_code && already_applied_code.trim().toUpperCase() === cleanCode) {
    return res.status(400).json({ success: false, message: 'This coupon is already applied to your order' });
  }

  const coupon = (db.data.coupons || []).find(c => c.code.toUpperCase() === cleanCode);

  // Validate coupon existence
  if (!coupon) {
    return res.status(404).json({ success: false, message: `Invalid coupon code "${cleanCode}". Try CAMPUS20` });
  }

  // Validate active status (Deactivation check)
  if (coupon.is_active === false) {
    return res.status(400).json({ success: false, message: `Coupon "${coupon.code}" has been deactivated` });
  }

  // Validate expiry date
  if (coupon.expiry_date) {
    const todayStr = getTodayStr();
    if (coupon.expiry_date < todayStr) {
      return res.status(400).json({ success: false, message: `This coupon expired on ${coupon.expiry_date}` });
    }
  }

  const rawSubtotal = subtotal !== undefined ? subtotal : (order_amount !== undefined ? order_amount : 0);
  const orderAmount = Number(rawSubtotal) || 0;

  // Validate minimum order requirement
  const minOrder = Number(coupon.minimum_order) || 0;
  if (orderAmount < minOrder) {
    return res.status(400).json({ 
      success: false, 
      coupon: coupon,
      message: `Minimum order amount of ₹${minOrder} required for code ${coupon.code}. Add ₹${minOrder - orderAmount} more!` 
    });
  }

  // Calculate discount safely with maximum discount ceiling
  let discount = 0;
  const discountVal = Number(coupon.discount_value) || 0;
  const maxDiscount = Number(coupon.max_discount) || 0;

  if (coupon.discount_type === 'percentage') {
    discount = Math.round((orderAmount * discountVal) / 100);
    if (maxDiscount > 0) {
      discount = Math.min(discount, maxDiscount);
    }
  } else {
    discount = discountVal;
    if (maxDiscount > 0) {
      discount = Math.min(discount, maxDiscount);
    }
  }

  // Ensure discount does not exceed the order amount
  discount = Math.max(0, Math.min(discount, orderAmount));

  res.json({
    success: true,
    message: `Promo code ${coupon.code} applied! Saved ₹${discount}`,
    discount: discount,
    discount_amount: discount,
    final_total: Math.max(0, orderAmount - discount),
    coupon: coupon
  });
});

// POST create new coupon (Admin Coupon Management)
router.post('/', (req, res) => {
  const { 
    code, 
    description, 
    discount_type, 
    discount_value, 
    minimum_order, 
    max_discount, 
    expiry_date, 
    badge,
    is_active 
  } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Coupon code is required' });
  }

  const cleanCode = code.trim().toUpperCase();

  // Validate duplicate code
  const existing = (db.data.coupons || []).find(c => c.code.toUpperCase() === cleanCode);
  if (existing) {
    return res.status(400).json({ success: false, message: `Coupon with code "${cleanCode}" already exists` });
  }

  if (discount_value === undefined || discount_value === null || discount_value === '') {
    return res.status(400).json({ success: false, message: 'Discount value is required' });
  }

  const numDiscount = Number(discount_value);
  if (isNaN(numDiscount) || numDiscount <= 0) {
    return res.status(400).json({ success: false, message: 'Discount value must be a positive number' });
  }

  const type = (discount_type && discount_type.toLowerCase() === 'flat') ? 'flat' : 'percentage';
  if (type === 'percentage' && numDiscount > 100) {
    return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%' });
  }

  const numMinOrder = Number(minimum_order) >= 0 ? Number(minimum_order) : 50;
  const numMaxDiscount = Number(max_discount) > 0 ? Number(max_discount) : (type === 'percentage' ? 50 : numDiscount);
  const expiry = expiry_date && expiry_date.trim() ? expiry_date.trim() : '2026-12-31';

  const newCoupon = {
    id: 'c-' + Date.now(),
    code: cleanCode,
    description: description ? description.trim() : `${numDiscount}${type === 'percentage' ? '%' : '₹'} off campus dining!`,
    discount_type: type,
    discount_value: numDiscount,
    minimum_order: numMinOrder,
    max_discount: numMaxDiscount,
    expiry_date: expiry,
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    badge: badge ? badge.trim() : 'Promotional Offer'
  };

  db.data.coupons = db.data.coupons || [];
  db.data.coupons.unshift(newCoupon);
  db.saveData();

  if (newCoupon.is_active) {
    eventBus.broadcast({
      type: 'COUPON_AVAILABLE',
      target: 'student',
      icon: 'COUPON',
      title: `Coupon Available: ${newCoupon.code}`,
      message: `${newCoupon.description} Use code ${newCoupon.code} to get ${newCoupon.discount_value}${newCoupon.discount_type === 'percentage' ? '%' : '₹'} OFF!`,
      data: { coupon: newCoupon, legacyType: 'NEW_OFFER' }
    });
  }

  res.status(201).json({
    success: true,
    message: `Coupon ${newCoupon.code} created successfully!`,
    coupon: newCoupon
  });
});

// PUT update / edit coupon details (Admin Coupon Management)
router.put('/:id', (req, res) => {
  const coupon = (db.data.coupons || []).find(c => c.id === req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }

  const { 
    code, 
    description, 
    discount_type, 
    discount_value, 
    minimum_order, 
    max_discount, 
    expiry_date, 
    badge, 
    is_active 
  } = req.body;

  // 1. Code update
  if (code !== undefined) {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return res.status(400).json({ success: false, message: 'Coupon code cannot be empty' });
    }
    const duplicate = (db.data.coupons || []).find(c => c.id !== coupon.id && c.code.toUpperCase() === cleanCode);
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Another coupon with code "${cleanCode}" already exists` });
    }
    coupon.code = cleanCode;
  }

  // 2. Discount type & value update
  if (discount_type !== undefined) {
    coupon.discount_type = (discount_type.toLowerCase() === 'flat') ? 'flat' : 'percentage';
  }

  if (discount_value !== undefined) {
    const num = Number(discount_value);
    if (isNaN(num) || num <= 0) {
      return res.status(400).json({ success: false, message: 'Discount value must be a positive number' });
    }
    if (coupon.discount_type === 'percentage' && num > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%' });
    }
    coupon.discount_value = num;
  }

  // 3. Minimum order update
  if (minimum_order !== undefined) {
    const min = Number(minimum_order);
    if (isNaN(min) || min < 0) {
      return res.status(400).json({ success: false, message: 'Minimum order must be 0 or higher' });
    }
    coupon.minimum_order = min;
  }

  // 4. Maximum discount update
  if (max_discount !== undefined) {
    const max = Number(max_discount);
    if (isNaN(max) || max <= 0) {
      return res.status(400).json({ success: false, message: 'Maximum discount must be greater than 0' });
    }
    coupon.max_discount = max;
  }

  // 5. Expiry date update
  if (expiry_date !== undefined) {
    coupon.expiry_date = expiry_date.trim();
  }

  // 6. Description and badge
  if (description !== undefined) {
    coupon.description = description.trim();
  }
  if (badge !== undefined) {
    coupon.badge = badge.trim();
  }

  // 7. Active / Deactivated toggle
  const prevActive = coupon.is_active;
  if (is_active !== undefined) {
    coupon.is_active = Boolean(is_active);
  }

  db.saveData();

  if (!prevActive && coupon.is_active) {
    eventBus.broadcast({
      type: 'COUPON_AVAILABLE',
      target: 'student',
      icon: 'COUPON',
      title: `Offer Re-activated: ${coupon.code}`,
      message: `${coupon.description} Use code ${coupon.code} on your next order!`,
      data: { coupon: coupon, legacyType: 'NEW_OFFER' }
    });
  }

  const todayStr = getTodayStr();
  res.json({
    success: true,
    message: `Coupon ${coupon.code} updated successfully`,
    coupon: {
      ...coupon,
      is_expired: coupon.expiry_date ? coupon.expiry_date < todayStr : false
    }
  });
});

// DELETE remove coupon (Admin)
router.delete('/:id', (req, res) => {
  const index = (db.data.coupons || []).findIndex(c => c.id === req.params.id);
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
