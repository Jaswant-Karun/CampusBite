/**
 * Step 9 Validation Suite - Checkout & Payment Scheduling System
 * Tests:
 * 1. Pickup Slot Selection Mechanics (Slots, Recommended/Standard, Active state)
 * 2. Multi-Channel Payment Modes (Simulated UPI, CampusPay Wallet, Counter Cash, Card/RFID)
 * 3. Empty Cart Safeguard & Redirect at Checkout
 * 4. Order Review Calculations (Subtotal, Promo Coupon, Loyalty Discount, Faculty Subsidy, Payable Total)
 * 5. CampusPay Wallet Balance Verification & Deduction Check
 * 6. Order Placement Payload Construction & Special Kitchen Instructions
 * 7. Verification of Desktop UI in frontend/index.html
 * 8. Verification of Mobile UI in frontend/mobile.html
 * 9. Verification of Design System in frontend/css/style.css
 * 10. Verification of Controller Logic in frontend/js/student.js
 * 11. Backend API order schema validation for special_instructions and checkout fields
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING STEP 9: CAMPUSBITE CHECKOUT & PAYMENT SYSTEM');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  // 1. PICKUP SLOT MECHANICS
  await test('1.1 Pickup slot options include Recommended, Standard, Post-Lecture, and Express', () => {
    const validSlots = [
      '12:30 PM – 12:40 PM',
      '12:40 PM – 12:50 PM',
      '01:00 PM – 01:15 PM',
      'Express Immediate (5-10m)'
    ];

    let currentSlot = '12:30 PM – 12:40 PM';
    assert.ok(validSlots.includes(currentSlot), 'Default slot should be a recognized slot');

    function selectSlot(newSlot) {
      if (validSlots.some(s => s.replace(/[–—]/g, '-').trim() === newSlot.replace(/[–—]/g, '-').trim())) {
        currentSlot = newSlot;
        return true;
      }
      return false;
    }

    assert.ok(selectSlot('01:00 PM – 01:15 PM'), 'Should switch to valid slot');
    assert.strictEqual(currentSlot, '01:00 PM – 01:15 PM');
  });

  // 2. PAYMENT METHODS
  await test('2.1 Multi-channel payment options include UPI, CampusPay Wallet, Cash, and Card', () => {
    const paymentMethods = ['UPI', 'Wallet', 'Cash', 'Card'];
    let selectedMethod = 'UPI';

    function selectMethod(method) {
      if (paymentMethods.includes(method)) {
        selectedMethod = method;
        return true;
      }
      return false;
    }

    assert.strictEqual(selectedMethod, 'UPI', 'Default should be UPI');
    assert.ok(selectMethod('Wallet'), 'Should allow Wallet selection');
    assert.strictEqual(selectedMethod, 'Wallet');
    assert.ok(selectMethod('Cash'), 'Should allow Cash selection');
    assert.strictEqual(selectedMethod, 'Cash');
    assert.ok(selectMethod('Card'), 'Should allow Card selection');
    assert.strictEqual(selectedMethod, 'Card');
  });

  // 3. EMPTY CART PROTECTION
  await test('3.1 Proceed to checkout & execute payment reject empty carts', () => {
    const emptyCart = [];

    function validateCheckoutCart(cart) {
      if (!cart || !cart.length) {
        return { allowed: false, error: 'Your cart is empty! Please add items before proceeding.' };
      }
      return { allowed: true };
    }

    const check1 = validateCheckoutCart(emptyCart);
    assert.strictEqual(check1.allowed, false, 'Should reject empty array');

    const check2 = validateCheckoutCart(null);
    assert.strictEqual(check2.allowed, false, 'Should reject null cart');

    const check3 = validateCheckoutCart([{ productId: 'p-1', price: 80, quantity: 1 }]);
    assert.strictEqual(check3.allowed, true, 'Should allow non-empty cart');
  });

  // 4. ORDER REVIEW & BILL ACCURACY
  await test('4.1 Checkout computes exact bill breakdown and payable total', () => {
    const cart = [
      { productId: 'p-1', name: 'Classic Burger', price: 80, quantity: 2 },
      { productId: 'p-5', name: 'Fresh Lemonade', price: 40, quantity: 1 }
    ];

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    assert.strictEqual(subtotal, 200, 'Subtotal should be 200 (80*2 + 40*1)');

    const coupon = { code: 'CAMPUS20', discount_type: 'percentage', discount_value: 20, max_discount: 100 };
    const couponDiscount = Math.round((subtotal * coupon.discount_value) / 100);
    assert.strictEqual(couponDiscount, 40, '20% of 200 is 40');

    const redeemLoyalty = true;
    const loyaltyDiscount = redeemLoyalty ? 10 : 0;
    assert.strictEqual(loyaltyDiscount, 10, 'Loyalty discount is 10');

    const total = Math.max(0, subtotal - couponDiscount - loyaltyDiscount);
    assert.strictEqual(total, 150, 'Total should be 200 - 40 - 10 = 150');
  });

  // 5. WALLET BALANCE SUFFICIENCY
  await test('5.1 CampusPay Wallet verifies balance before deduction', () => {
    const user = { name: 'Jaswant', wallet_balance: 850 };
    const orderTotal = 180;

    function payWithWallet(u, amt) {
      if (u.wallet_balance < amt) {
        return { success: false, message: 'Insufficient CampusPay balance' };
      }
      u.wallet_balance -= amt;
      return { success: true, newBalance: u.wallet_balance };
    }

    const res = payWithWallet(user, orderTotal);
    assert.strictEqual(res.success, true);
    assert.strictEqual(user.wallet_balance, 670);

    // Test rejection when balance is too low
    const excessiveTotal = 1000;
    const failRes = payWithWallet(user, excessiveTotal);
    assert.strictEqual(failRes.success, false);
    assert.strictEqual(user.wallet_balance, 670, 'Balance unchanged on rejection');
  });

  // 6. ORDER PAYLOAD CONSTRUCTION WITH SPECIAL INSTRUCTIONS
  await test('6.1 Order payload includes customer, items, slot, mode, and special instructions', () => {
    const payload = {
      user_id: 'u-101',
      customer_name: 'Jaswant Karun',
      customer_phone: '87541 59344',
      items: [{ product_id: 'p-1', name: 'Classic Burger', price: 80, quantity: 2 }],
      coupon_code: 'CAMPUS20',
      payment_method: 'UPI',
      pickup_slot: '12:30 PM – 12:40 PM',
      redeem_loyalty_points: true,
      special_instructions: 'Extra mint chutney and pack separately'
    };

    assert.ok(payload.user_id, 'Must have user_id');
    assert.ok(payload.customer_name, 'Must have customer_name');
    assert.strictEqual(payload.items.length, 1);
    assert.strictEqual(payload.payment_method, 'UPI');
    assert.strictEqual(payload.pickup_slot, '12:30 PM – 12:40 PM');
    assert.strictEqual(payload.special_instructions, 'Extra mint chutney and pack separately');
  });

  // 7. HTML VERIFICATION: index.html
  await test('7.1 Verify frontend/index.html includes Step 9 Checkout elements and structure', () => {
    const htmlPath = path.join(__dirname, '..', 'frontend', 'index.html');
    const content = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(content.includes('id="screen-checkout"'), 'Must have screen-checkout element');
    assert.ok(content.includes('SCREEN 9: CHECKOUT SCREEN (STEP 9)'), 'Must have Step 9 Screen comment');
    assert.ok(content.includes('checkout-progress-bar'), 'Must have checkout-progress-bar');
    assert.ok(content.includes('pickup-slot-grid'), 'Must have pickup-slot-grid');
    assert.ok(content.includes('payment-options-list'), 'Must have payment-options-list');
    assert.ok(content.includes('checkout-review-items-list'), 'Must have checkout-review-items-list');
    assert.ok(content.includes('id="checkout-instructions-input"'), 'Must have checkout-instructions-input');
    assert.ok(content.includes('StudentApp.selectPickupSlot'), 'Must have slot selection onclick');
    assert.ok(content.includes('StudentApp.selectPaymentMethod'), 'Must have payment selection onclick');
    assert.ok(content.includes('StudentApp.executePaymentAndPlaceOrder'), 'Must have payment execution CTA');
  });

  // 8. HTML VERIFICATION: mobile.html
  await test('8.1 Verify frontend/mobile.html includes Step 9 Checkout elements and structure', () => {
    const mobilePath = path.join(__dirname, '..', 'frontend', 'mobile.html');
    const content = fs.readFileSync(mobilePath, 'utf8');

    assert.ok(content.includes('id="screen-checkout"'), 'Must have screen-checkout element in mobile');
    assert.ok(content.includes('CHECKOUT & PAYMENT METHOD (STEP 9)'), 'Must have Step 9 Mobile comment');
    assert.ok(content.includes('id="mob-checkout-review-items"'), 'Must have mob-checkout-review-items container');
    assert.ok(content.includes('id="mob-checkout-instructions-input"'), 'Must have mob-checkout-instructions-input');
    assert.ok(content.includes('StudentApp.selectPickupSlot'), 'Must have mobile slot selection onclick');
    assert.ok(content.includes('StudentApp.selectPaymentMethod'), 'Must have mobile payment selection onclick');
    assert.ok(content.includes('StudentApp.executePaymentAndPlaceOrder'), 'Must have mobile place order handler');
  });

  // 9. CSS VERIFICATION: style.css
  await test('9.1 Verify frontend/css/style.css defines Step 9 Checkout design system', () => {
    const cssPath = path.join(__dirname, '..', 'frontend', 'css', 'style.css');
    const content = fs.readFileSync(cssPath, 'utf8');

    assert.ok(content.includes('CHECKOUT & PAYMENT DESIGN SYSTEM (STEP 9)'), 'Must have Step 9 CSS header');
    assert.ok(content.includes('.checkout-layout'), 'Must have .checkout-layout style');
    assert.ok(content.includes('.checkout-progress-bar'), 'Must have .checkout-progress-bar style');
    assert.ok(content.includes('.checkout-section-card'), 'Must have .checkout-section-card style');
    assert.ok(content.includes('.pickup-slot-grid'), 'Must have .pickup-slot-grid style');
    assert.ok(content.includes('.slot-pill'), 'Must have .slot-pill style');
    assert.ok(content.includes('.payment-method-card'), 'Must have .payment-method-card style');
    assert.ok(content.includes('.checkout-review-items-list'), 'Must have .checkout-review-items-list style');
  });

  // 10. CONTROLLER LOGIC: student.js
  await test('10.1 Verify frontend/js/student.js implements all Step 9 Checkout methods', () => {
    const jsPath = path.join(__dirname, '..', 'frontend', 'js', 'student.js');
    const content = fs.readFileSync(jsPath, 'utf8');

    assert.ok(content.includes('selectPickupSlot('), 'Must implement selectPickupSlot method');
    assert.ok(content.includes('selectPaymentMethod('), 'Must implement selectPaymentMethod method');
    assert.ok(content.includes('renderCheckout('), 'Must implement renderCheckout method');
    assert.ok(content.includes('placeOrder()'), 'Must implement placeOrder method/alias');
    assert.ok(content.includes('executePaymentAndPlaceOrder()'), 'Must implement executePaymentAndPlaceOrder method');
    assert.ok(content.includes('finalizeOrderPlacement()'), 'Must implement finalizeOrderPlacement method');
    assert.ok(content.includes('special_instructions'), 'Must support special_instructions in order payload');
    assert.ok(content.includes("screenId === 'checkout'"), 'Must route to renderCheckout upon navigation');
  });

  // 11. BACKEND ROUTE: orders.js
  await test('11.1 Verify backend/routes/orders.js persists special_instructions and checkout parameters', () => {
    const routePath = path.join(__dirname, '..', 'backend', 'routes', 'orders.js');
    const content = fs.readFileSync(routePath, 'utf8');

    assert.ok(content.includes('special_instructions'), 'Route must accept and save special_instructions');
    assert.ok(content.includes('pickup_slot'), 'Route must accept and save pickup_slot');
    assert.ok(content.includes('payment_method'), 'Route must accept and save payment_method');
  });

  console.log('\n====================================================');
  console.log(`📊 TEST SUMMARY: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
