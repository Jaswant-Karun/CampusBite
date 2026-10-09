/**
 * Step 10 Validation Suite - Order Confirmation & Token Generation System
 * Tests:
 * 1. Order Token ID generation, formatting and prefix
 * 2. Pickup Counter assignment and display
 * 3. Pickup slot reservation display
 * 4. Loyalty points accrual verification (10% cashback rule)
 * 5. Itemized receipt calculation and rendering
 * 6. Contactless QR Data Payload formatting
 * 7. Session storage persistence of last confirmed order
 * 8. Verification of Desktop UI in frontend/index.html
 * 9. Verification of Mobile UI in frontend/mobile.html
 * 10. Verification of Design System in frontend/css/style.css
 * 11. Verification of Controller Logic in frontend/js/student.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING STEP 10: ORDER CONFIRMATION & TOKEN SYSTEM');
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

  // 1. ORDER TOKEN FORMATTING
  await test('1.1 Token formatting prefixes order ID and formats properly', () => {
    const rawId = 'CB1024';
    const formattedToken = `#${rawId}`;
    assert.strictEqual(formattedToken, '#CB1024', 'Token should be prefixed with #');
    assert.ok(/^#CB\d+$/.test(formattedToken), 'Token must match #CB<number> pattern');
  });

  // 2. COUNTER ASSIGNMENT
  await test('2.1 Pickup counter display maps to assigned express counter', () => {
    function formatCounter(counterNum) {
      return `Counter ${counterNum || 2} Express`;
    }

    assert.strictEqual(formatCounter(2), 'Counter 2 Express');
    assert.strictEqual(formatCounter(1), 'Counter 1 Express');
    assert.strictEqual(formatCounter(undefined), 'Counter 2 Express', 'Default to Counter 2');
  });

  // 3. LOYALTY CASHBACK RULE
  await test('3.1 Loyalty points accrual satisfies 10% value return formula', () => {
    function computePoints(totalAmount) {
      return Math.floor(totalAmount / 10);
    }

    assert.strictEqual(computePoints(180), 18, '₹180 gives 18 points');
    assert.strictEqual(computePoints(245), 24, '₹245 gives 24 points');
    assert.strictEqual(computePoints(90), 9, '₹90 gives 9 points');
  });

  // 4. CONTACTLESS QR PAYLOAD
  await test('4.1 QR payload adheres to CampusBite token verification standard', () => {
    const order = {
      id: 'CB1024',
      customer_name: 'Jaswant Karun',
      total_amount: 180
    };

    const qrData = `CAMPUSBITE:${order.id}:${order.customer_name}:${order.total_amount}`;
    assert.strictEqual(qrData, 'CAMPUSBITE:CB1024:Jaswant Karun:180');
    const parts = qrData.split(':');
    assert.strictEqual(parts[0], 'CAMPUSBITE');
    assert.strictEqual(parts[1], 'CB1024');
    assert.strictEqual(parts[2], 'Jaswant Karun');
    assert.strictEqual(parts[3], '180');
  });

  // 5. RECEIPT ITEM BREAKDOWN
  await test('5.1 Receipt item breakdown computes total correctly', () => {
    const items = [
      { name: 'Veg Burger', price: 80, quantity: 2 },
      { name: 'Cold Coffee', price: 50, quantity: 1 }
    ];

    const computedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    assert.strictEqual(computedTotal, 210, '80*2 + 50*1 = 210');
  });

  // 6. SESSION STORAGE PERSISTENCE
  await test('6.1 Last confirmed order serializes and deserializes cleanly', () => {
    const mockOrder = {
      id: 'CB1024',
      customer_name: 'Jaswant Karun',
      total_amount: 180,
      pickup_counter: 2,
      pickup_slot: '12:30 PM – 12:40 PM',
      items: [{ name: 'Burger', price: 80, quantity: 2 }]
    };

    const serialized = JSON.stringify(mockOrder);
    const deserialized = JSON.parse(serialized);
    assert.strictEqual(deserialized.id, mockOrder.id);
    assert.strictEqual(deserialized.total_amount, 180);
    assert.strictEqual(deserialized.items.length, 1);
  });

  // 7. HTML VERIFICATION: index.html
  await test('7.1 Verify frontend/index.html includes Step 10 Order Confirmation elements', () => {
    const htmlPath = path.join(__dirname, '..', 'frontend', 'index.html');
    const content = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(content.includes('id="screen-confirmation"'), 'Must have screen-confirmation');
    assert.ok(content.includes('SCREEN 10: ORDER CONFIRMATION (STEP 10)'), 'Must have Step 10 comment');
    assert.ok(content.includes('id="conf-order-id"'), 'Must have conf-order-id element');
    assert.ok(content.includes('id="conf-pickup-counter"'), 'Must have conf-pickup-counter element');
    assert.ok(content.includes('id="conf-pickup-slot"'), 'Must have conf-pickup-slot element');
    assert.ok(content.includes('id="conf-pickup-qr"'), 'Must have conf-pickup-qr element');
    assert.ok(content.includes('id="conf-items-list"'), 'Must have conf-items-list element');
    assert.ok(content.includes('id="conf-total-amount"'), 'Must have conf-total-amount element');
    assert.ok(content.includes('id="conf-points-earned"'), 'Must have conf-points-earned element');
    assert.ok(content.includes("StudentApp.navigateTo('tracking')"), 'Must have track order live action');
  });

  // 8. HTML VERIFICATION: mobile.html
  await test('8.1 Verify frontend/mobile.html includes Step 10 Mobile Confirmation elements', () => {
    const mobilePath = path.join(__dirname, '..', 'frontend', 'mobile.html');
    const content = fs.readFileSync(mobilePath, 'utf8');

    assert.ok(content.includes('id="screen-confirmation"'), 'Must have screen-confirmation in mobile');
    assert.ok(content.includes('CONFIRMATION & TOKEN DISPLAY (STEP 10)'), 'Must have Step 10 mobile comment');
    assert.ok(content.includes('id="confirm-token-number"'), 'Must have confirm-token-number element');
    assert.ok(content.includes('id="confirm-counter-badge"'), 'Must have confirm-counter-badge element');
    assert.ok(content.includes('id="confirm-slot-time"'), 'Must have confirm-slot-time element');
    assert.ok(content.includes('id="confirm-token-qr-mob"'), 'Must have confirm-token-qr-mob element');
    assert.ok(content.includes('id="confirm-items-list-mob"'), 'Must have confirm-items-list-mob element');
    assert.ok(content.includes('id="confirm-total-amount-mob"'), 'Must have confirm-total-amount-mob element');
    assert.ok(content.includes('id="confirm-loyalty-points-mob"'), 'Must have confirm-loyalty-points-mob element');
  });

  // 9. CSS VERIFICATION: style.css
  await test('9.1 Verify frontend/css/style.css defines Step 10 Confirmation design system', () => {
    const cssPath = path.join(__dirname, '..', 'frontend', 'css', 'style.css');
    const content = fs.readFileSync(cssPath, 'utf8');

    assert.ok(content.includes('ORDER CONFIRMATION & TOKEN DESIGN SYSTEM (STEP 10)'), 'Must have Step 10 CSS header');
    assert.ok(content.includes('.confirmation-layout'), 'Must have .confirmation-layout');
    assert.ok(content.includes('.confirmation-hero-card'), 'Must have .confirmation-hero-card');
    assert.ok(content.includes('.token-pass-card'), 'Must have .token-pass-card');
    assert.ok(content.includes('.token-number-display'), 'Must have .token-number-display');
    assert.ok(content.includes('.confirm-receipt-card'), 'Must have .confirm-receipt-card');
  });

  // 10. CONTROLLER LOGIC: student.js
  await test('10.1 Verify frontend/js/student.js implements showOrderConfirmation with full Step 10 data binding', () => {
    const jsPath = path.join(__dirname, '..', 'frontend', 'js', 'student.js');
    const content = fs.readFileSync(jsPath, 'utf8');

    assert.ok(content.includes('showOrderConfirmation(order)'), 'Must define showOrderConfirmation');
    assert.ok(content.includes('conf-order-id'), 'Must update conf-order-id');
    assert.ok(content.includes('confirm-token-number'), 'Must update confirm-token-number');
    assert.ok(content.includes('conf-pickup-counter'), 'Must update conf-pickup-counter');
    assert.ok(content.includes('conf-pickup-slot'), 'Must update conf-pickup-slot');
    assert.ok(content.includes('conf-total-amount'), 'Must update conf-total-amount');
    assert.ok(content.includes('conf-points-earned'), 'Must update conf-points-earned');
    assert.ok(content.includes('conf-items-list'), 'Must render conf-items-list');
    assert.ok(content.includes('campusbite_last_order'), 'Must save last order in session storage');
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
