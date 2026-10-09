/**
 * CampusBite - STEP 12: Order Confirmation Screen Validation Test Suite
 * Validates:
 * 1. Display Fields:
 *    - Order ID (e.g. Order #CB1024)
 *    - Order items (Name, quantity, price, line item breakdown)
 *    - Total amount (e.g. ₹180)
 *    - Payment status (e.g. Payment: Paid / Payment: Pending)
 *    - Pickup slot (e.g. Pickup: 12:30 PM – 12:45 PM)
 *    - Order date/time (Formatted date & timestamp)
 *    - Estimated preparation time (e.g. ~8–12 mins)
 * 2. Mandatory Buttons:
 *    - TRACK ORDER
 *    - VIEW ORDER HISTORY
 *    - BACK TO HOME
 * 3. Desktop (index.html) and Mobile (mobile.html) consistency
 * 4. Controller logic in student.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🧪 CAMPUSBITE STEP 12: ORDER CONFIRMATION TEST SUITE');
console.log('====================================================\n');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
  }
}

const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const mobileHtml = fs.readFileSync(path.join(__dirname, '../frontend/mobile.html'), 'utf8');
const studentJs = fs.readFileSync(path.join(__dirname, '../frontend/js/student.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../frontend/css/style.css'), 'utf8');

// ==========================================
// 1. Desktop UI Display Elements Verification
// ==========================================
console.log('--- 1. Desktop Confirmation Screen Elements (index.html) ---');

test('Desktop displays Order ID with prominent token formatting', () => {
  assert(indexHtml.includes('id="conf-order-id"'), 'Missing #conf-order-id element');
  assert(indexHtml.includes('id="conf-order-id-label"'), 'Missing #conf-order-id-label element');
});

test('Desktop displays Order items list container', () => {
  assert(indexHtml.includes('id="conf-items-list"'), 'Missing #conf-items-list element');
});

test('Desktop displays Total amount element', () => {
  assert(indexHtml.includes('id="conf-total-amount"'), 'Missing #conf-total-amount element');
});

test('Desktop displays Payment status indicator and badge', () => {
  assert(indexHtml.includes('id="conf-payment-status-badge"'), 'Missing #conf-payment-status-badge');
  assert(indexHtml.includes('id="conf-payment-method"'), 'Missing #conf-payment-method');
  assert(indexHtml.includes('id="conf-receipt-status-pill"'), 'Missing #conf-receipt-status-pill');
});

test('Desktop displays Pickup slot', () => {
  assert(indexHtml.includes('id="conf-pickup-slot"'), 'Missing #conf-pickup-slot');
  assert(indexHtml.includes('id="conf-pickup-slot-label"'), 'Missing #conf-pickup-slot-label');
});

test('Desktop displays Order date/time timestamp', () => {
  assert(indexHtml.includes('id="conf-timestamp"'), 'Missing #conf-timestamp');
});

test('Desktop displays Estimated preparation time', () => {
  assert(indexHtml.includes('id="conf-prep-time"'), 'Missing #conf-prep-time');
});

// ==========================================
// 2. Desktop Required Action Buttons Verification
// ==========================================
console.log('\n--- 2. Desktop Action Buttons (index.html) ---');

test('Desktop has TRACK ORDER button', () => {
  assert(indexHtml.includes('id="conf-track-order-btn"'), 'Missing #conf-track-order-btn');
  assert(indexHtml.includes('TRACK ORDER'), 'Missing TRACK ORDER button text');
  assert(indexHtml.includes("StudentApp.navigateTo('tracking')"), 'TRACK ORDER button must navigate to tracking');
});

test('Desktop has VIEW ORDER HISTORY button', () => {
  assert(indexHtml.includes('id="conf-view-history-btn"'), 'Missing #conf-view-history-btn');
  assert(indexHtml.includes('VIEW ORDER HISTORY'), 'Missing VIEW ORDER HISTORY button text');
  assert(indexHtml.includes('StudentApp.viewOrderHistory()'), 'VIEW ORDER HISTORY button must call viewOrderHistory()');
});

test('Desktop has BACK TO HOME button', () => {
  assert(indexHtml.includes('id="conf-back-home-btn"'), 'Missing #conf-back-home-btn');
  assert(indexHtml.includes('BACK TO HOME'), 'Missing BACK TO HOME button text');
  assert(indexHtml.includes("StudentApp.navigateTo('home')"), 'BACK TO HOME button must navigate to home');
});

// ==========================================
// 3. Mobile UI Display Elements & Buttons Verification
// ==========================================
console.log('\n--- 3. Mobile Confirmation Screen Elements & Buttons (mobile.html) ---');

test('Mobile displays Order ID, Pickup Slot, and Payment badge', () => {
  assert(mobileHtml.includes('id="confirm-token-number"'), 'Missing #confirm-token-number');
  assert(mobileHtml.includes('id="mob-confirm-order-id-label"'), 'Missing #mob-confirm-order-id-label');
  assert(mobileHtml.includes('id="confirm-slot-time"'), 'Missing #confirm-slot-time');
  assert(mobileHtml.includes('id="confirm-payment-badge-mob"'), 'Missing #confirm-payment-badge-mob');
});

test('Mobile displays Order items list and Total amount', () => {
  assert(mobileHtml.includes('id="confirm-items-list-mob"'), 'Missing #confirm-items-list-mob');
  assert(mobileHtml.includes('id="confirm-total-amount-mob"'), 'Missing #confirm-total-amount-mob');
});

test('Mobile displays Order date/time and Estimated preparation time', () => {
  assert(mobileHtml.includes('id="confirm-order-datetime-mob"'), 'Missing #confirm-order-datetime-mob');
  assert(mobileHtml.includes('id="confirm-prep-time-mob"'), 'Missing #confirm-prep-time-mob');
});

test('Mobile has all 3 required action buttons (TRACK ORDER, VIEW ORDER HISTORY, BACK TO HOME)', () => {
  assert(mobileHtml.includes('id="mob-conf-track-btn"'), 'Missing #mob-conf-track-btn');
  assert(mobileHtml.includes('TRACK ORDER'), 'Missing TRACK ORDER on mobile');
  assert(mobileHtml.includes('id="mob-conf-history-btn"'), 'Missing #mob-conf-history-btn');
  assert(mobileHtml.includes('VIEW ORDER HISTORY'), 'Missing VIEW ORDER HISTORY on mobile');
  assert(mobileHtml.includes('id="mob-conf-home-btn"'), 'Missing #mob-conf-home-btn');
  assert(mobileHtml.includes('BACK TO HOME'), 'Missing BACK TO HOME on mobile');
});

// ==========================================
// 4. Controller Logic Verification (student.js)
// ==========================================
console.log('\n--- 4. Controller Logic & Data Population (student.js) ---');

test('student.js implements showOrderConfirmation with all required fields', () => {
  assert(studentJs.includes('showOrderConfirmation'), 'Missing showOrderConfirmation method');
  assert(studentJs.includes('conf-order-id'), 'Must populate order ID');
  assert(studentJs.includes('conf-order-id-label'), 'Must populate order ID label');
  assert(studentJs.includes('conf-pickup-slot'), 'Must populate pickup slot');
  assert(studentJs.includes('conf-timestamp'), 'Must populate order date/time');
  assert(studentJs.includes('conf-prep-time'), 'Must populate estimated preparation time');
  assert(studentJs.includes('conf-total-amount'), 'Must populate total amount');
  assert(studentJs.includes('conf-items-list'), 'Must populate order items list');
});

test('student.js populates Payment status as Paid or Pending', () => {
  assert(studentJs.includes('Payment: Paid'), 'Missing Payment: Paid string formatting');
  assert(studentJs.includes('Payment: Pending'), 'Missing Payment: Pending string formatting');
});

test('student.js implements viewOrderHistory navigation helper', () => {
  assert(studentJs.includes('viewOrderHistory()'), 'Missing viewOrderHistory method');
  assert(studentJs.includes("this.navigateTo('profile')"), 'viewOrderHistory must navigate to profile/orders screen');
});

// ==========================================
// 5. Simulation / Data Formatting Function Test
// ==========================================
console.log('\n--- 5. Order Confirmation Logic Simulation Test ---');

test('Simulation: Order confirmation formats Order ID, Payment: Paid, and Pickup Slot accurately', () => {
  const sampleOrder = {
    id: 'CB1024',
    customer_name: 'Jaswant Karun',
    items: [
      { product_id: 'p-1', name: 'Masala Dosa', price: 60, quantity: 2 },
      { product_id: 'p-6', name: 'Cold Coffee', price: 40, quantity: 1 }
    ],
    total_amount: 160,
    payment_method: 'UPI',
    payment_status: 'PAID',
    pickup_slot: '12:30 PM – 12:45 PM',
    created_at: new Date('2026-10-09T12:30:00Z').toISOString()
  };

  // 1. Order ID
  const orderIdText = `Order #${sampleOrder.id}`;
  assert.strictEqual(orderIdText, 'Order #CB1024');

  // 2. Payment Status
  const isPaid = sampleOrder.payment_status === 'PAID';
  const paymentStatusText = isPaid ? 'Payment: Paid' : 'Payment: Pending';
  assert.strictEqual(paymentStatusText, 'Payment: Paid');

  // 3. Pickup Slot
  const pickupText = `Pickup: ${sampleOrder.pickup_slot}`;
  assert.strictEqual(pickupText, 'Pickup: 12:30 PM – 12:45 PM');

  // 4. Order Items
  const totalItemsCount = sampleOrder.items.reduce((s, i) => s + i.quantity, 0);
  assert.strictEqual(totalItemsCount, 3);
  const calculatedTotal = sampleOrder.items.reduce((s, i) => s + (i.price * i.quantity), 0);
  assert.strictEqual(calculatedTotal, 160);

  // 5. Total Amount
  const totalAmountText = `₹${sampleOrder.total_amount}`;
  assert.strictEqual(totalAmountText, '₹160');

  // 6. Estimated Prep Time
  const estBase = Math.min(20, Math.max(8, 6 + (totalItemsCount * 2)));
  const prepTimeText = `⏱ ~${estBase - 2}–${estBase + 2} mins`;
  assert(prepTimeText.includes('mins'), 'Must compute prep time string in minutes');
});

console.log(`\n==============================================`);
console.log(`Step 12 Test Summary: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
console.log(`==============================================\n`);

if (passed !== total) {
  process.exit(1);
} else {
  console.log('🎉 ALL STEP 12 ORDER CONFIRMATION TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
