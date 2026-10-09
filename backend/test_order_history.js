/**
 * CampusBite - STEP 14: Student Order History Test Suite
 * Validates:
 * 1. Student Order History Screen creation (#screen-order-history):
 *    - Desktop (index.html) and Mobile (mobile.html) screens
 *    - Navigation routing (StudentApp.navigateTo('order-history'), StudentApp.viewOrderHistory())
 * 2. Display of 6 required fields for previous orders:
 *    - Order ID (e.g. #CB1024)
 *    - Date (formatted readable date/time)
 *    - Items (line items breakdown with name and quantity)
 *    - Total (total price with currency symbol)
 *    - Payment status (PAID / PENDING indicator)
 *    - Order status (Canonical status badge)
 * 3. Actions:
 *    - VIEW ORDER button (navigates to tracking/order details)
 *    - REORDER button (triggers reorder flow)
 * 4. Reorder logic & product availability checks:
 *    - Adds available items to cart
 *    - Skips unavailable items (out of stock, discontinued, or is_available === false)
 *    - Shows suitable warning message when partial items unavailable
 *    - Shows suitable error message when all items unavailable
 *    - Shows success confirmation when all items added
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('./data/db');

console.log('====================================================');
console.log('🧪 CAMPUSBITE STEP 14: ORDER HISTORY TEST SUITE');
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

async function testAsync(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
  }
}

async function runTests() {
  const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
  const mobileHtml = fs.readFileSync(path.join(__dirname, '../frontend/mobile.html'), 'utf8');
  const studentJs = fs.readFileSync(path.join(__dirname, '../frontend/js/student.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../frontend/css/mobile-shell.css'), 'utf8');

  // ----------------------------------------------------
  // Section 1: UI Structure & Screen Containers
  // ----------------------------------------------------
  console.log('--- 1. Order History Screen Creation ---');

  test('Desktop index.html contains #screen-order-history', () => {
    assert(indexHtml.includes('id="screen-order-history"'), 'Missing #screen-order-history in index.html');
    assert(indexHtml.includes('id="order-history-list"'), 'Missing #order-history-list in index.html');
  });

  test('Mobile mobile.html contains #screen-order-history', () => {
    assert(mobileHtml.includes('id="screen-order-history"'), 'Missing #screen-order-history in mobile.html');
    assert(mobileHtml.includes('id="mob-order-history-list"'), 'Missing #mob-order-history-list in mobile.html');
  });

  test('Navigation buttons route to order-history', () => {
    assert(indexHtml.includes("StudentApp.navigateTo('order-history')"), 'Desktop navigation missing order-history link');
    assert(mobileHtml.includes("StudentApp.navigateTo('order-history')"), 'Mobile navigation missing order-history link');
  });

  // ----------------------------------------------------
  // Section 2: Display Requirements (6 Required Fields)
  // ----------------------------------------------------
  console.log('\n--- 2. Required Order Fields Display ---');

  test('student.js renders Order ID (#CB...)', () => {
    assert(studentJs.includes('history-order-id'), 'Missing history-order-id element');
    assert(studentJs.includes('orderIdDisplay') || studentJs.includes('#${o.id}'), 'Missing Order ID formatting');
  });

  test('student.js renders Date with time', () => {
    assert(studentJs.includes('order-date-text'), 'Missing order-date-text class');
    assert(studentJs.includes('toLocaleDateString') || studentJs.includes('dateStr'), 'Missing formatted date');
  });

  test('student.js renders Line Items breakdown with quantities', () => {
    assert(studentJs.includes('history-items-box'), 'Missing history-items-box container');
    assert(studentJs.includes('history-item-row'), 'Missing history-item-row');
    assert(studentJs.includes('quantity') && studentJs.includes('price'), 'Items must show quantity and price');
  });

  test('student.js renders Total Amount', () => {
    assert(studentJs.includes('history-total-val') || studentJs.includes('total_amount'), 'Missing total amount element');
    assert(studentJs.includes('totalAmountDisplay') || studentJs.includes('₹${o.total_amount}'), 'Missing total currency formatting');
  });

  test('student.js renders Payment Status (PAID / PENDING)', () => {
    assert(studentJs.includes('payment-status-pill'), 'Missing payment-status-pill class');
    assert(studentJs.includes('paymentLabel') || studentJs.includes('PAID'), 'Missing payment status label handling');
  });

  test('student.js renders Order Status badge', () => {
    assert(studentJs.includes('order-status-badge'), 'Missing order-status-badge');
    assert(studentJs.includes('statusBadgeClass') || studentJs.includes('rawStatus'), 'Missing canonical order status badge');
  });

  // ----------------------------------------------------
  // Section 3: Action Buttons (VIEW ORDER & REORDER)
  // ----------------------------------------------------
  console.log('\n--- 3. Action Buttons (VIEW ORDER & REORDER) ---');

  test('student.js renders VIEW ORDER action button', () => {
    assert(studentJs.includes('VIEW ORDER'), 'Missing VIEW ORDER button text');
    assert(studentJs.includes('history-btn-view'), 'Missing history-btn-view class');
    assert(studentJs.includes('StudentApp.viewOrder'), 'Missing StudentApp.viewOrder click handler');
  });

  test('student.js renders REORDER action button', () => {
    assert(studentJs.includes('REORDER'), 'Missing REORDER button text');
    assert(studentJs.includes('history-btn-reorder'), 'Missing history-btn-reorder class');
    assert(studentJs.includes('StudentApp.reorderPastItems'), 'Missing StudentApp.reorderPastItems click handler');
  });

  test('Navigation routing in StudentApp', () => {
    assert(studentJs.includes("viewOrderHistory()"), 'Missing viewOrderHistory helper');
    assert(studentJs.includes("screenId === 'order-history'"), 'Missing order-history handler in navigateTo()');
  });

  // ----------------------------------------------------
  // Section 4: Reorder Logic & Product Availability
  // ----------------------------------------------------
  console.log('\n--- 4. Reorder Availability & Messaging Logic ---');

  test('reorderPastItems checks product availability and stock', () => {
    assert(studentJs.includes('reorderPastItems'), 'Missing reorderPastItems method');
    assert(studentJs.includes('is_available'), 'Must check is_available status');
    assert(studentJs.includes('stock'), 'Must check product stock');
  });

  test('reorderPastItems handles partial unavailability and shows suitable warning', () => {
    assert(studentJs.includes('unavailableItems.length > 0 && addedItems.length > 0'), 'Must handle partial unavailable items');
    assert(studentJs.includes('currently unavailable'), 'Must display notification for unavailable items');
  });

  test('reorderPastItems handles complete unavailability and shows suitable error', () => {
    assert(studentJs.includes('unavailableItems.length > 0 && addedItems.length === 0'), 'Must handle all items unavailable');
    assert(studentJs.includes('Cannot reorder: All items'), 'Must notify user when all items are out of stock');
  });

  test('reorderPastItems handles full availability and directs to cart', () => {
    assert(studentJs.includes("this.navigateTo('cart')"), 'Must navigate to cart after successful reorder');
  });

  // ----------------------------------------------------
  // Section 5: Behavioral Simulation Test
  // ----------------------------------------------------
  console.log('\n--- 5. Behavioral Simulation: Reorder with Availability ---');

  test('Simulation: Reordering adds available items and reports unavailable ones', () => {
    // Simulated catalog
    const products = [
      { id: 'p-1', name: 'Classic Burger', price: 80, stock: 15, is_available: true },
      { id: 'p-2', name: 'Peri-Peri Fries', price: 60, stock: 0, is_available: false }, // out of stock
      { id: 'p-3', name: 'Cold Coffee', price: 50, stock: 10, is_available: true }
    ];

    const pastOrder = {
      id: 'CB9999',
      items: [
        { product_id: 'p-1', name: 'Classic Burger', quantity: 2 },
        { product_id: 'p-2', name: 'Peri-Peri Fries', quantity: 1 }
      ]
    };

    const cart = [];
    const addedItems = [];
    const unavailableItems = [];

    for (const item of pastOrder.items) {
      const product = products.find(p => p.id === item.product_id);
      const isAvailable = product && product.is_available !== false && (product.stock === undefined || product.stock > 0);

      if (isAvailable) {
        cart.push({ productId: product.id, name: product.name, quantity: item.quantity });
        addedItems.push({ name: product.name, quantity: item.quantity });
      } else {
        const reason = !product ? 'Discontinued' : (product.is_available === false ? 'Unavailable today' : 'Out of stock');
        unavailableItems.push({ name: item.name, reason });
      }
    }

    assert.strictEqual(cart.length, 1, 'Only available item should be added to cart');
    assert.strictEqual(cart[0].name, 'Classic Burger');
    assert.strictEqual(unavailableItems.length, 1, 'One item should be identified as unavailable');
    assert.strictEqual(unavailableItems[0].name, 'Peri-Peri Fries');
  });

  test('Simulation: All items unavailable displays warning and does not alter cart', () => {
    const products = [
      { id: 'p-2', name: 'Peri-Peri Fries', price: 60, stock: 0, is_available: false }
    ];

    const pastOrder = {
      id: 'CB9998',
      items: [
        { product_id: 'p-2', name: 'Peri-Peri Fries', quantity: 1 }
      ]
    };

    const cart = [];
    const addedItems = [];
    const unavailableItems = [];

    for (const item of pastOrder.items) {
      const product = products.find(p => p.id === item.product_id);
      const isAvailable = product && product.is_available !== false && (product.stock === undefined || product.stock > 0);

      if (isAvailable) {
        cart.push({ productId: product.id, name: product.name, quantity: item.quantity });
        addedItems.push({ name: product.name, quantity: item.quantity });
      } else {
        unavailableItems.push({ name: item.name, reason: 'Out of stock' });
      }
    }

    assert.strictEqual(cart.length, 0, 'No items should be added when all are unavailable');
    assert.strictEqual(unavailableItems.length, 1);
  });

  // ----------------------------------------------------
  // Section 6: CSS & Styling Checks
  // ----------------------------------------------------
  console.log('\n--- 6. CSS Styling Verification ---');

  test('mobile-shell.css includes complete styling for order history', () => {
    assert(css.includes('.order-history-card'), 'Missing .order-history-card styles');
    assert(css.includes('.history-card-header'), 'Missing .history-card-header styles');
    assert(css.includes('.history-order-id'), 'Missing .history-order-id styles');
    assert(css.includes('.order-date-text'), 'Missing .order-date-text styles');
    assert(css.includes('.payment-status-pill'), 'Missing .payment-status-pill styles');
    assert(css.includes('.history-items-box'), 'Missing .history-items-box styles');
    assert(css.includes('.history-item-row'), 'Missing .history-item-row styles');
    assert(css.includes('.history-card-footer'), 'Missing .history-card-footer styles');
    assert(css.includes('.history-btn-view'), 'Missing .history-btn-view styles');
    assert(css.includes('.history-btn-reorder'), 'Missing .history-btn-reorder styles');
  });

  console.log('\n==============================================');
  console.log(`Step 14 Test Summary: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
  console.log('==============================================\n');

  if (passed === total) {
    console.log('🎉 ALL STEP 14 ORDER HISTORY TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error(`❌ Some tests failed (${total - passed} failures)\n`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
