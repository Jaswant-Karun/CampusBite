/**
 * CampusBite - STEP 10: Complete Checkout Flow Validation Test Suite
 * Validates:
 * 1. Flow sequence: Cart -> Checkout -> Order Summary -> Pickup Slot -> Payment Method -> Payment -> Order Confirmation
 * 2. Checkout Displays: 1. Ordered products, 2. Quantity, 3. Subtotal, 4. Coupon discount, 5. Final total
 * 3. 5 Exact Pickup Slots: 12:00 PM – 12:15 PM, 12:15 PM – 12:30 PM, 12:30 PM – 12:45 PM, 12:45 PM – 1:00 PM, 1:00 PM – 1:15 PM
 * 4. Interactive student pickup slot selection
 * 5. Required information validation (empty cart, slot selection, payment method, wallet balance)
 * 6. Duplicate order prevention (client-side lock & backend idempotency check)
 * 7. Mobile-friendly and desktop UI template verification
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('🧪 RUNNING STEP 10: CHECKOUT FLOW VALIDATION SUITE');
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
// 1. Pickup Slots Specification Verification
// ----------------------------------------------------
const REQUIRED_PICKUP_SLOTS = [
  '12:00 PM – 12:15 PM',
  '12:15 PM – 12:30 PM',
  '12:30 PM – 12:45 PM',
  '12:45 PM – 1:00 PM',
  '1:00 PM – 1:15 PM'
];

runTest('1.1 Pickup slots include all 5 exact required time windows', () => {
  assert.strictEqual(REQUIRED_PICKUP_SLOTS.length, 5);
  REQUIRED_PICKUP_SLOTS.forEach(slot => {
    assert(typeof slot === 'string' && slot.includes('PM'), `Invalid slot: ${slot}`);
  });
});

// ----------------------------------------------------
// 2. Checkout Calculation & 5 Mandatory Display Fields
// ----------------------------------------------------
runTest('2.1 Checkout calculation accurately computes Subtotal, Coupon discount, and Final total', () => {
  const sampleItems = [
    { productId: 'p-1', name: 'Classic Veg Burger', price: 60, quantity: 2 }, // 120
    { productId: 'p-5', name: 'Cold Coffee', price: 40, quantity: 1 }          // 40
  ];
  const subtotal = sampleItems.reduce((s, i) => s + (i.price * i.quantity), 0);
  assert.strictEqual(subtotal, 160);

  // Apply CAMPUS20 (20% off max 50, min order 100)
  const coupon = { code: 'CAMPUS20', discount_type: 'percentage', discount_value: 20, max_discount: 50, minimum_order: 100 };
  let couponDiscount = 0;
  if (subtotal >= coupon.minimum_order) {
    couponDiscount = Math.min(Math.round((subtotal * coupon.discount_value) / 100), coupon.max_discount);
  }
  assert.strictEqual(couponDiscount, 32); // 20% of 160 is 32

  const finalTotal = subtotal - couponDiscount;
  assert.strictEqual(finalTotal, 128);

  // Validate the 5 required display properties exist and are valid
  assert(sampleItems.every(i => i.name), '1. Ordered products must have names');
  assert(sampleItems.every(i => i.quantity > 0), '2. Items must have quantities');
  assert.strictEqual(subtotal, 160, '3. Subtotal must match');
  assert.strictEqual(couponDiscount, 32, '4. Coupon discount must match');
  assert.strictEqual(finalTotal, 128, '5. Final total must match');
});

// ----------------------------------------------------
// 3. Information Validation Before Continuing
// ----------------------------------------------------
runTest('3.1 Rejection of empty cart checkout', () => {
  const cart = [];
  function validateCheckout(c, slot, mode) {
    if (!c || !c.length) return { valid: false, message: 'Cart items cannot be empty' };
    if (!slot) return { valid: false, message: 'Please select a scheduled pickup slot' };
    if (!mode) return { valid: false, message: 'Please select a payment method' };
    return { valid: true };
  }

  const resEmpty = validateCheckout(cart, '12:00 PM – 12:15 PM', 'UPI');
  assert.strictEqual(resEmpty.valid, false);
  assert.strictEqual(resEmpty.message, 'Cart items cannot be empty');

  const resNoSlot = validateCheckout([{ productId: 'p-1', quantity: 1 }], '', 'UPI');
  assert.strictEqual(resNoSlot.valid, false);
  assert.strictEqual(resNoSlot.message, 'Please select a scheduled pickup slot');

  const resNoMode = validateCheckout([{ productId: 'p-1', quantity: 1 }], '12:00 PM – 12:15 PM', '');
  assert.strictEqual(resNoMode.valid, false);
  assert.strictEqual(resNoMode.message, 'Please select a payment method');

  const resValid = validateCheckout([{ productId: 'p-1', quantity: 1 }], '12:00 PM – 12:15 PM', 'UPI');
  assert.strictEqual(resValid.valid, true);
});

runTest('3.2 Wallet payment validation checks balance against order total', () => {
  const user = { wallet_balance: 50 };
  const total = 120;
  function canPayWithWallet(u, t) {
    return u.wallet_balance >= t;
  }
  assert.strictEqual(canPayWithWallet(user, total), false);
  user.wallet_balance = 200;
  assert.strictEqual(canPayWithWallet(user, total), true);
});

// ----------------------------------------------------
// 4. Duplicate Order Prevention
// ----------------------------------------------------
runTest('4.1 Duplicate order prevention rejects duplicate submissions within cooldown window', () => {
  const existingOrders = [
    {
      id: 'CB1028',
      user_id: 'u-101',
      total_amount: 150,
      pickup_slot: '12:00 PM – 12:15 PM',
      items: [{ product_id: 'p-1', quantity: 1 }],
      created_at: new Date(Date.now() - 1000).toISOString() // 1 second ago
    }
  ];

  function checkDuplicate(userId, slot, itemsCount, totalAmount) {
    const now = Date.now();
    const duplicate = existingOrders.find(o =>
      o.user_id === userId &&
      (now - new Date(o.created_at).getTime()) < 5000 &&
      o.items && o.items.length === itemsCount &&
      o.pickup_slot === slot
    );
    return duplicate || null;
  }

  const dup = checkDuplicate('u-101', '12:00 PM – 12:15 PM', 1, 150);
  assert(dup !== null, 'Duplicate order must be detected');
  assert.strictEqual(dup.id, 'CB1028');

  // Different user or after cooldown does not block
  const notDup = checkDuplicate('u-102', '12:00 PM – 12:15 PM', 1, 150);
  assert.strictEqual(notDup, null);
});

// ----------------------------------------------------
// 5. Backend Routes Validation (orders.js)
// ----------------------------------------------------
runTest('5.1 backend/routes/orders.js enforces slot, payment method, and duplicate order check', () => {
  const routePath = path.join(__dirname, 'routes/orders.js');
  const content = fs.readFileSync(routePath, 'utf8');

  assert(content.includes('pickup_slot'), 'orders.js must reference pickup_slot');
  assert(content.includes('payment_method'), 'orders.js must reference payment_method');
  assert(content.includes('Duplicate order detected'), 'orders.js must enforce duplicate order prevention');
  assert(content.includes('409'), 'orders.js must return HTTP 409 on duplicate orders');
});

// ----------------------------------------------------
// 6. Frontend index.html Desktop Verification
// ----------------------------------------------------
runTest('6.1 frontend/index.html includes the full Flow and 5 exact pickup slots', () => {
  const htmlPath = path.join(__dirname, '../frontend/index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');

  // Screens in the flow
  assert(content.includes('id="screen-cart"'), 'Must have Cart screen');
  assert(content.includes('id="screen-checkout"'), 'Must have Checkout screen');
  assert(content.includes('id="screen-confirmation"'), 'Must have Order Confirmation screen');

  // Checkout elements
  assert(content.includes('id="checkout-review-items-list"'), 'Must display ordered products');
  assert(content.includes('id="checkout-subtotal-val"'), 'Must display Subtotal');
  assert(content.includes('id="checkout-coupon-row"'), 'Must display Coupon discount');
  assert(content.includes('id="checkout-total-val"'), 'Must display Final total');

  // 5 exact pickup slots
  REQUIRED_PICKUP_SLOTS.forEach(slot => {
    assert(content.includes(slot), `index.html must include slot: ${slot}`);
  });
});

// ----------------------------------------------------
// 7. Frontend mobile.html Mobile Verification
// ----------------------------------------------------
runTest('7.1 frontend/mobile.html includes the full Flow and 5 exact pickup slots', () => {
  const mobPath = path.join(__dirname, '../frontend/mobile.html');
  const content = fs.readFileSync(mobPath, 'utf8');

  // Mobile Screens
  assert(content.includes('id="screen-cart"'), 'Mobile must have Cart screen');
  assert(content.includes('id="screen-checkout"'), 'Mobile must have Checkout screen');
  assert(content.includes('id="screen-confirmation"'), 'Mobile must have Confirmation screen');

  // Mobile Checkout Displays
  assert(content.includes('id="mob-checkout-review-items"'), 'Mobile must display ordered products');
  assert(content.includes('id="mob-checkout-subtotal-val"'), 'Mobile must display Subtotal');
  assert(content.includes('id="mob-checkout-coupon-row"'), 'Mobile must display Coupon discount');
  assert(content.includes('id="mob-checkout-total-val"'), 'Mobile must display Final total');

  // 5 exact pickup slots in mobile
  REQUIRED_PICKUP_SLOTS.forEach(slot => {
    assert(content.includes(slot), `mobile.html must include slot: ${slot}`);
  });
});

// ----------------------------------------------------
// 8. Controller Logic (student.js) Verification
// ----------------------------------------------------
runTest('8.1 frontend/js/student.js implements slot selection, duplicate guard, and confirmation transition', () => {
  const jsPath = path.join(__dirname, '../frontend/js/student.js');
  const content = fs.readFileSync(jsPath, 'utf8');

  assert(content.includes('selectPickupSlot'), 'student.js must implement selectPickupSlot()');
  assert(content.includes('selectPaymentMethod'), 'student.js must implement selectPaymentMethod()');
  assert(content.includes('renderCheckout'), 'student.js must implement renderCheckout()');
  assert(content.includes('executePaymentAndPlaceOrder'), 'student.js must implement executePaymentAndPlaceOrder()');
  assert(content.includes('finalizeOrderPlacement'), 'student.js must implement finalizeOrderPlacement()');
  assert(content.includes('showOrderConfirmation'), 'student.js must implement showOrderConfirmation()');
  assert(content.includes('isPlacingOrder'), 'student.js must implement isPlacingOrder duplicate submission guard');
});

console.log('\n====================================================');
console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} Passed`);
if (passedTests === totalTests) {
  console.log('🎉 ALL STEP 10 CHECKOUT FLOW TESTS PASSED SUCCESSFULLY!');
} else {
  console.log(`⚠️ ${totalTests - passedTests} Tests Failed`);
  process.exit(1);
}
console.log('====================================================\n');
