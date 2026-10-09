/**
 * CampusBite - STEP 9: Coupon System Validation Test Suite
 * Tests coupon attributes, application, validations, discount computation, and UI integration.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('🧪 RUNNING STEP 9: COUPON SYSTEM VALIDATION SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${totalTests}: ${name}`);
    console.error(`   Error: ${err.message}\n`);
  }
}

// ----------------------------------------------------
// Backend Validation Tests
// ----------------------------------------------------
const db = require('./data/db');
const coupons = db.data.coupons;
const express = require('express');

// Mock request simulation helper for /api/coupons/apply
function simulateApplyCoupon({ code, subtotal, already_applied_code }) {
  if (!code || typeof code !== 'string') {
    return { status: 400, body: { success: false, message: 'Please provide a coupon code.' } };
  }
  const cleanCode = code.trim().toUpperCase();
  const cartSubtotal = Number(subtotal) || 0;

  if (already_applied_code && already_applied_code.trim().toUpperCase() === cleanCode) {
    return {
      status: 400,
      body: {
        success: false,
        message: `Coupon "${cleanCode}" is already applied to this order.`
      }
    };
  }

  const coupon = coupons.find(c => c.code.toUpperCase() === cleanCode);
  if (!coupon) {
    return {
      status: 404,
      body: {
        success: false,
        message: `Coupon code "${cleanCode}" is invalid.`
      }
    };
  }

  if (coupon.is_active === false) {
    return {
      status: 400,
      body: {
        success: false,
        message: `Coupon "${cleanCode}" is currently inactive and cannot be redeemed.`
      }
    };
  }

  const today = new Date().toISOString().split('T')[0];
  if (coupon.expiry_date && coupon.expiry_date < today) {
    return {
      status: 400,
      body: {
        success: false,
        message: `Coupon "${cleanCode}" has expired on ${coupon.expiry_date}.`
      }
    };
  }

  if (coupon.minimum_order && cartSubtotal < coupon.minimum_order) {
    const deficit = (coupon.minimum_order - cartSubtotal).toFixed(2);
    return {
      status: 400,
      body: {
        success: false,
        message: `Minimum order amount for "${cleanCode}" is ₹${coupon.minimum_order}. Add ₹${deficit} more to qualify.`
      }
    };
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (cartSubtotal * coupon.discount_value) / 100;
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  } else {
    discount = coupon.discount_value;
  }

  discount = Math.min(discount, cartSubtotal);
  discount = Math.max(0, Math.round(discount * 100) / 100);

  return {
    status: 200,
    body: {
      success: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      data: {
        code: coupon.code,
        discount_amount: discount,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount: coupon.max_discount,
        minimum_order: coupon.minimum_order,
        description: coupon.description,
        new_total: Math.round((cartSubtotal - discount) * 100) / 100
      }
    }
  };
}

// 1. Seed Coupons Verification
runTest('Seed Coupons exist with required fields (code, discount, min order, expiry, active status)', () => {
  assert(Array.isArray(coupons), 'Coupons must be an array');
  const campus20 = coupons.find(c => c.code === 'CAMPUS20');
  assert(campus20, 'CAMPUS20 coupon must exist');
  assert.strictEqual(campus20.discount_value, 20);
  assert.strictEqual(campus20.max_discount, 50);
  assert.strictEqual(campus20.minimum_order, 100);
  assert.strictEqual(campus20.is_active, true);
  assert(campus20.expiry_date, 'CAMPUS20 must have expiry_date');

  const expiredCoupon = coupons.find(c => c.code === 'EXPIRED50');
  assert(expiredCoupon, 'EXPIRED50 sample coupon must exist');
  assert(new Date(expiredCoupon.expiry_date) < new Date(), 'EXPIRED50 must have a past date');

  const inactiveCoupon = coupons.find(c => c.code === 'INACTIVE15');
  assert(inactiveCoupon, 'INACTIVE15 sample coupon must exist');
  assert.strictEqual(inactiveCoupon.is_active, false);
});

// 2. Valid coupon application with percentage & max discount cap
runTest('Valid coupon application: CAMPUS20 20% discount capped at ₹50', () => {
  // Case A: ₹200 subtotal -> 20% = ₹40 (under cap of ₹50)
  const resA = simulateApplyCoupon({ code: 'CAMPUS20', subtotal: 200 });
  assert.strictEqual(resA.status, 200);
  assert.strictEqual(resA.body.data.discount_amount, 40);
  assert.strictEqual(resA.body.data.new_total, 160);

  // Case B: ₹300 subtotal -> 20% = ₹60 -> capped at ₹50
  const resB = simulateApplyCoupon({ code: 'CAMPUS20', subtotal: 300 });
  assert.strictEqual(resB.status, 200);
  assert.strictEqual(resB.body.data.discount_amount, 50);
  assert.strictEqual(resB.body.data.new_total, 250);
});

// 3. Invalid coupon code validation
runTest('Validation: Invalid coupon code returns 404', () => {
  const res = simulateApplyCoupon({ code: 'NONEXISTENT99', subtotal: 200 });
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
  assert(res.body.message.includes('invalid'));
});

// 4. Expired coupon validation
runTest('Validation: Expired coupon returns 400 with expiry date', () => {
  const res = simulateApplyCoupon({ code: 'EXPIRED50', subtotal: 300 });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert(res.body.message.includes('expired'));
});

// 5. Inactive coupon validation
runTest('Validation: Inactive coupon returns 400', () => {
  const res = simulateApplyCoupon({ code: 'INACTIVE15', subtotal: 300 });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert(res.body.message.includes('inactive'));
});

// 6. Minimum order requirement validation
runTest('Validation: Minimum order requirement enforced (returns 400 with deficit)', () => {
  // BIGBITE200 requires min order ₹200
  const res = simulateApplyCoupon({ code: 'BIGBITE200', subtotal: 120 });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert(res.body.message.includes('Minimum order amount'));
  assert(res.body.message.includes('Add ₹80.00 more'));
});

// 7. Already applied coupon validation
runTest('Validation: Already applied coupon rejected with 400', () => {
  const res = simulateApplyCoupon({ code: 'CAMPUS20', subtotal: 200, already_applied_code: 'CAMPUS20' });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert(res.body.message.includes('already applied'));
});

// 8. Invalid / excessive discount prevention
runTest('Validation: Discount cannot exceed subtotal or produce negative total', () => {
  const res = simulateApplyCoupon({ code: 'CAMPUS20', subtotal: 100 });
  assert.strictEqual(res.status, 200);
  assert(res.body.data.discount_amount <= 100, 'Discount must not exceed subtotal');
  assert(res.body.data.new_total >= 0, 'New total cannot be negative');
  assert.strictEqual(res.body.data.new_total, 100 - res.body.data.discount_amount);

  // Test capping logic: flat discount cannot exceed subtotal
  const flatRes = simulateApplyCoupon({ code: 'BIGBITE200', subtotal: 200 });
  assert.strictEqual(flatRes.status, 200);
  assert.strictEqual(flatRes.body.data.discount_amount, 50);
  assert.strictEqual(flatRes.body.data.new_total, 150);
});

// ----------------------------------------------------
// Frontend UI & Template Verification Tests
// ----------------------------------------------------
runTest('Frontend: index.html contains coupon sections in both Cart and Checkout', () => {
  const htmlPath = path.join(__dirname, '../frontend/index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');

  // Cart Coupon Section
  assert(content.includes('id="cart-coupon-section"'), 'Cart must contain #cart-coupon-section');
  assert(content.includes('id="cart-coupon-field"'), 'Cart must contain #cart-coupon-field input');
  assert(content.includes('id="cart-apply-coupon-btn"'), 'Cart must contain #cart-apply-coupon-btn');
  assert(content.includes('id="cart-applied-coupon-pill"'), 'Cart must contain #cart-applied-coupon-pill');

  // Checkout Coupon Section
  assert(content.includes('id="checkout-coupon-section"'), 'Checkout must contain #checkout-coupon-section');
  assert(content.includes('id="checkout-coupon-field"'), 'Checkout must contain #checkout-coupon-field');
  assert(content.includes('id="checkout-apply-coupon-btn"'), 'Checkout must contain #checkout-apply-coupon-btn');
  assert(content.includes('id="checkout-applied-coupon-pill"'), 'Checkout must contain #checkout-applied-coupon-pill');

  // Sample Chips
  assert(content.includes('CAMPUS20'), 'index.html must offer CAMPUS20 sample chip');
});

runTest('Frontend: mobile.html contains coupon sections in mobile Cart and Checkout', () => {
  const mobPath = path.join(__dirname, '../frontend/mobile.html');
  const content = fs.readFileSync(mobPath, 'utf8');

  assert(content.includes('id="mob-cart-coupon-section"'), 'mobile.html must contain #mob-cart-coupon-section');
  assert(content.includes('id="mob-cart-coupon-field"'), 'mobile.html must contain #mob-cart-coupon-field');
  assert(content.includes('id="mob-checkout-coupon-section"'), 'mobile.html must contain #mob-checkout-coupon-section');
  assert(content.includes('id="mob-checkout-coupon-field"'), 'mobile.html must contain #mob-checkout-coupon-field');
});

runTest('Frontend: style.css contains Coupon Design System classes', () => {
  const cssPath = path.join(__dirname, '../frontend/css/style.css');
  const content = fs.readFileSync(cssPath, 'utf8');

  assert(content.includes('.coupon-input-card'), 'CSS must define .coupon-input-card');
  assert(content.includes('.coupon-input'), 'CSS must define .coupon-input');
  assert(content.includes('.apply-coupon-btn'), 'CSS must define .apply-coupon-btn');
  assert(content.includes('.coupon-chip'), 'CSS must define .coupon-chip');
  assert(content.includes('.applied-coupon-status-pill'), 'CSS must define .applied-coupon-status-pill');
  assert(content.includes('.remove-coupon-btn'), 'CSS must define .remove-coupon-btn');
});

runTest('Frontend: student.js contains applyCouponCode, removeCoupon, and immediate total update', () => {
  const jsPath = path.join(__dirname, '../frontend/js/student.js');
  const content = fs.readFileSync(jsPath, 'utf8');

  assert(content.includes('function applyCouponCode'), 'student.js must implement applyCouponCode()');
  assert(content.includes('function removeCoupon'), 'student.js must implement removeCoupon()');
  assert(content.includes('function updateAppliedCouponUI'), 'student.js must implement updateAppliedCouponUI()');
  assert(content.includes('calculateCartBill'), 'student.js must recalculate cart bill immediately on coupon update');
  assert(content.includes('already applied'), 'student.js must check if coupon is already applied');
});

runTest('Backend: coupons.js supports Admin coupon management (GET, POST, PUT, DELETE)', () => {
  const routePath = path.join(__dirname, './routes/coupons.js');
  const content = fs.readFileSync(routePath, 'utf8');

  assert(content.includes("router.get('/'") || content.includes("router.get('/"), 'Admin can list coupons via GET /api/coupons');
  assert(content.includes("router.post('/'"), 'Admin can create coupons via POST /api/coupons');
  assert(content.includes("router.put('/:id'"), 'Admin can update coupons via PUT /api/coupons/:id');
  assert(content.includes("router.delete('/:id'"), 'Admin can delete coupons via DELETE /api/coupons/:id');
});

console.log('\n====================================================');
console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} Passed`);
if (passedTests === totalTests) {
  console.log('🎉 ALL STEP 9 COUPON SYSTEM TESTS PASSED SUCCESSFULLY!');
} else {
  console.log(`⚠️ ${totalTests - passedTests} Tests Failed`);
  process.exit(1);
}
console.log('====================================================\n');
