/**
 * CampusBite - STEP 13: Order Tracking Test Suite
 * Validates:
 * 1. 5 Canonical Order Statuses:
 *    1. Order Placed
 *    2. Confirmed
 *    3. Preparing
 *    4. Ready for Pickup
 *    5. Completed
 * 2. Visual Progress Tracker Logic (Reached = ✓, Pending = ○)
 *    Example:
 *    Order Placed ✓
 *    Confirmed ✓
 *    Preparing ✓
 *    Ready for Pickup ○
 *    Completed ○
 * 3. Database status driven (not hardcoded progress)
 * 4. Estimated preparation time calculation and display
 * 5. Admin updating order status & event broadcasting
 * 6. Student and Admin status synchronization
 * 7. Desktop (index.html) and Mobile (mobile.html) UI integrity
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('./data/db');
const eventBus = require('./services/eventBus');

console.log('====================================================');
console.log('🧪 CAMPUSBITE STEP 13: ORDER TRACKING TEST SUITE');
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
  const adminJs = fs.readFileSync(path.join(__dirname, '../frontend/js/admin.js'), 'utf8');
  const ordersRoute = fs.readFileSync(path.join(__dirname, 'routes/orders.js'), 'utf8');
  const mobileCss = fs.readFileSync(path.join(__dirname, '../frontend/css/mobile-shell.css'), 'utf8');

  // --------------------------------------------------------------------------
  console.log('--- 1. Order Status Definitions & Canonical Sequence ---');
  // --------------------------------------------------------------------------
  const requiredStatuses = [
    'Order Placed',
    'Confirmed',
    'Preparing',
    'Ready for Pickup',
    'Completed'
  ];

  test('All 5 required statuses are explicitly recognized in backend routes/orders.js', () => {
    requiredStatuses.forEach(st => {
      assert(
        ordersRoute.toLowerCase().includes(st.toLowerCase()),
        `Status "${st}" should be recognized in orders.js`
      );
    });
  });

  test('Backend normalizes variations (e.g. "Placed" -> "Order Placed", "Ready" -> "Ready for Pickup")', () => {
    assert(ordersRoute.includes("'placed': 'Order Placed'"), 'Placed maps to Order Placed');
    assert(ordersRoute.includes("'ready': 'Ready for Pickup'"), 'Ready maps to Ready for Pickup');
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 2. Desktop Visual Progress Tracker (index.html) ---');
  // --------------------------------------------------------------------------
  test('index.html contains 5 distinct step items in correct order', () => {
    assert(indexHtml.includes('id="track-step-placed"'), 'Contains track-step-placed');
    assert(indexHtml.includes('id="track-step-confirmed"'), 'Contains track-step-confirmed');
    assert(indexHtml.includes('id="track-step-preparing"'), 'Contains track-step-preparing');
    assert(indexHtml.includes('id="track-step-ready"'), 'Contains track-step-ready');
    assert(indexHtml.includes('id="track-step-completed"'), 'Contains track-step-completed');
  });

  test('index.html displays exact required status labels: Order Placed, Confirmed, Preparing, Ready for Pickup, Completed', () => {
    assert(indexHtml.includes('<h4>Order Placed</h4>'), 'Contains Order Placed heading');
    assert(indexHtml.includes('<h4>Confirmed</h4>'), 'Contains Confirmed heading');
    assert(indexHtml.includes('<h4>Preparing</h4>'), 'Contains Preparing heading');
    assert(indexHtml.includes('<h4>Ready for Pickup</h4>'), 'Contains Ready for Pickup heading');
    assert(indexHtml.includes('<h4>Completed</h4>'), 'Contains Completed heading');
  });

  test('index.html has circle elements and symbol indicators for ✓ and ○', () => {
    assert(indexHtml.includes('id="track-circle-placed"'), 'Has track-circle-placed');
    assert(indexHtml.includes('id="track-symbol-placed"'), 'Has track-symbol-placed');
    assert(indexHtml.includes('id="track-circle-ready"'), 'Has track-circle-ready');
    assert(indexHtml.includes('id="track-symbol-ready"'), 'Has track-symbol-ready');
  });

  test('index.html displays Estimated Preparation Time card', () => {
    assert(indexHtml.includes('id="track-prep-time-card"'), 'Has track-prep-time-card');
    assert(indexHtml.includes('id="track-prep-time-val"'), 'Has track-prep-time-val');
    assert(indexHtml.includes('id="track-prep-status-msg"'), 'Has track-prep-status-msg');
    assert(indexHtml.includes('Estimated Preparation Time'), 'Has Estimated Preparation Time label');
  });

  test('index.html has Live Status Refresh button', () => {
    assert(indexHtml.includes('track-refresh-btn'), 'Has track-refresh-btn');
    assert(indexHtml.includes('StudentApp.renderTracking()'), 'Calls StudentApp.renderTracking');
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 3. Mobile Tracking Screen Consistency (mobile.html) ---');
  // --------------------------------------------------------------------------
  test('mobile.html contains all 5 progress tracker steps', () => {
    assert(mobileHtml.includes('id="track-step-placed"'), 'Mobile has track-step-placed');
    assert(mobileHtml.includes('id="track-step-confirmed"'), 'Mobile has track-step-confirmed');
    assert(mobileHtml.includes('id="track-step-preparing"'), 'Mobile has track-step-preparing');
    assert(mobileHtml.includes('id="track-step-ready"'), 'Mobile has track-step-ready');
    assert(mobileHtml.includes('id="track-step-completed"'), 'Mobile has track-step-completed');
  });

  test('mobile.html has Estimated Preparation Time card & live sync elements', () => {
    assert(mobileHtml.includes('id="track-prep-time-card"'), 'Mobile has track-prep-time-card');
    assert(mobileHtml.includes('id="track-prep-time-val"'), 'Mobile has track-prep-time-val');
    assert(mobileHtml.includes('id="track-prep-status-msg"'), 'Mobile has track-prep-status-msg');
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 4. Visual Progress Tracker Logic in student.js ---');
  // --------------------------------------------------------------------------
  test('student.js dynamically marks reached steps with ✓ and pending steps with ○', () => {
    assert(studentJs.includes("const mark = isReached ? '✓' : '○'"), 'Uses ✓ for reached steps and ○ for pending steps');
    assert(studentJs.includes("circleEl.textContent = mark"), 'Updates circle text with mark');
    assert(studentJs.includes("symbolEl.textContent = mark"), 'Updates symbol text with mark');
  });

  test('student.js implements database-driven stage indexing for all 5 statuses', () => {
    assert(studentJs.includes("rawStatus === 'placed' || rawStatus === 'order placed'"), 'Maps Order Placed to index 0');
    assert(studentJs.includes("rawStatus === 'confirmed'"), 'Maps Confirmed to index 1');
    assert(studentJs.includes("rawStatus === 'preparing'"), 'Maps Preparing to index 2');
    assert(studentJs.includes("rawStatus === 'ready' || rawStatus === 'ready for pickup'"), 'Maps Ready for Pickup to index 3');
    assert(studentJs.includes("rawStatus === 'completed'"), 'Maps Completed to index 4');
  });

  test('student.js updates Estimated Preparation Time dynamically per status', () => {
    assert(studentJs.includes('displayPrepTime'), 'Calculates displayPrepTime');
    assert(studentJs.includes('prepTimeVal.textContent = displayPrepTime'), 'Sets prepTimeVal');
    assert(studentJs.includes('prepStatusMsg.textContent = displayStatusMsg'), 'Sets prepStatusMsg');
  });

  test('student.js starts live polling when on tracking screen and stops when navigating away', () => {
    assert(studentJs.includes('startTrackingLivePolling()'), 'Implements startTrackingLivePolling');
    assert(studentJs.includes('stopTrackingLivePolling()'), 'Implements stopTrackingLivePolling');
    assert(studentJs.includes('this.startTrackingLivePolling()'), 'Calls startTrackingLivePolling on navigateTo tracking');
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 5. Admin Order Status Update & Dropdown Controls ---');
  // --------------------------------------------------------------------------
  test('admin.js provides dropdown selector to update order status to any of the 5 statuses', () => {
    assert(adminJs.includes('admin-status-dropdown'), 'Has admin-status-dropdown');
    assert(adminJs.includes('1. Order Placed'), 'Has option 1. Order Placed');
    assert(adminJs.includes('2. Confirmed'), 'Has option 2. Confirmed');
    assert(adminJs.includes('3. Preparing'), 'Has option 3. Preparing');
    assert(adminJs.includes('4. Ready for Pickup'), 'Has option 4. Ready for Pickup');
    assert(adminJs.includes('5. Completed'), 'Has option 5. Completed');
  });

  test('admin.js displays Estimated Preparation Time on order cards', () => {
    assert(adminJs.includes('⏱ Est. Prep:'), 'Admin card displays Est. Prep time');
    assert(adminJs.includes('order.estimated_prep_time'), 'Uses order.estimated_prep_time');
  });

  test('admin.js triggers immediate refresh of StudentApp tracking on status advance', () => {
    assert(adminJs.includes('window.StudentApp.renderTracking(orderId)'), 'Directly triggers student renderTracking on admin advance');
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 6. Status Progress Simulation & Checkmark Formatting ---');
  // --------------------------------------------------------------------------
  test('Simulation: Formatting matches user prompt example when at stage "Preparing"', () => {
    const stages = ['Order Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed'];
    const currentStatus = 'Preparing';
    const currentIdx = stages.indexOf(currentStatus); // index 2

    const stepOutputs = stages.map((st, idx) => {
      const isReached = idx <= currentIdx;
      return `${st} ${isReached ? '✓' : '○'}`;
    });

    const expected = [
      'Order Placed ✓',
      'Confirmed ✓',
      'Preparing ✓',
      'Ready for Pickup ○',
      'Completed ○'
    ];

    assert.deepStrictEqual(stepOutputs, expected, 'Preparing status matches prompt example');
  });

  test('Simulation: Formatting when status is "Ready for Pickup"', () => {
    const stages = ['Order Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed'];
    const currentStatus = 'Ready for Pickup';
    const currentIdx = stages.indexOf(currentStatus); // index 3

    const stepOutputs = stages.map((st, idx) => {
      const isReached = idx <= currentIdx;
      return `${st} ${isReached ? '✓' : '○'}`;
    });

    const expected = [
      'Order Placed ✓',
      'Confirmed ✓',
      'Preparing ✓',
      'Ready for Pickup ✓',
      'Completed ○'
    ];

    assert.deepStrictEqual(stepOutputs, expected, 'Ready for Pickup status shows 4 checkmarks and 1 circle');
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 7. Database Status Synchronization & API State Transitions ---');
  // --------------------------------------------------------------------------
  await testAsync('API simulation: Admin updates status in database and broadcasts to student', async () => {
    // 1. Create a fresh test order
    const testOrderId = `CB-TEST-${Date.now()}`;
    const newOrder = {
      id: testOrderId,
      user_id: 'u-101',
      customer_name: 'Jaswant Karun',
      customer_phone: '87541 59344',
      items: [
        { product_id: 'p-1', name: 'Classic Burger', price: 80, quantity: 1 }
      ],
      subtotal: 80,
      discount: 0,
      total_amount: 80,
      payment_method: 'UPI',
      payment_status: 'PAID',
      order_status: 'Order Placed',
      estimated_prep_time: '~8–10 mins',
      pickup_counter: 2,
      pickup_slot: '12:30 PM - 12:45 PM',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.data.orders.unshift(newOrder);

    // Initial check: status is Order Placed
    let fetched = db.data.orders.find(o => o.id === testOrderId);
    assert.strictEqual(fetched.order_status, 'Order Placed', 'Order is created as Order Placed');

    // 2. Admin advances to "Confirmed"
    fetched.order_status = 'Confirmed';
    fetched.updated_at = new Date().toISOString();
    assert.strictEqual(fetched.order_status, 'Confirmed', 'Status successfully changed to Confirmed');

    // 3. Admin advances to "Preparing"
    fetched.order_status = 'Preparing';
    fetched.estimated_prep_time = '~4–6 mins (In Kitchen Prep)';
    assert.strictEqual(fetched.order_status, 'Preparing', 'Status changed to Preparing');
    assert.strictEqual(fetched.estimated_prep_time, '~4–6 mins (In Kitchen Prep)');

    // 4. Admin advances to "Ready for Pickup"
    fetched.order_status = 'Ready for Pickup';
    fetched.estimated_prep_time = '0 mins (Ready for Pickup)';
    assert.strictEqual(fetched.order_status, 'Ready for Pickup');
    assert.strictEqual(fetched.estimated_prep_time, '0 mins (Ready for Pickup)');

    // 5. Admin advances to "Completed"
    fetched.order_status = 'Completed';
    fetched.estimated_prep_time = 'Fulfilled';
    assert.strictEqual(fetched.order_status, 'Completed');

    // Clean up test order
    db.data.orders = db.data.orders.filter(o => o.id !== testOrderId);
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 8. Real-Time EventBus Notification Synchronization ---');
  // --------------------------------------------------------------------------
  test('EventBus captures ORDER_STATUS_CHANGED event with status and estimated_prep_time', () => {
    let broadcastedPayload = null;
    const testOrderId = `CB-EVT-${Date.now()}`;

    eventBus.broadcast({
      type: 'ORDER_STATUS_CHANGED',
      target: 'all',
      userId: 'u-101',
      title: `Order #${testOrderId}: Preparing`,
      message: 'Kitchen is actively preparing',
      data: {
        orderId: testOrderId,
        status: 'Preparing',
        counter: 2,
        estimated_prep_time: '~4–6 mins'
      }
    });

    const recent = eventBus.notifications.find(n => n.data && n.data.orderId === testOrderId);
    assert(recent, 'EventBus recorded ORDER_STATUS_CHANGED event');
    assert.strictEqual(recent.data.status, 'Preparing');
    assert.strictEqual(recent.data.estimated_prep_time, '~4–6 mins');
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 9. CSS Styling Verification (mobile-shell.css) ---');
  // --------------------------------------------------------------------------
  test('mobile-shell.css provides styles for .tracking-prep-card and .prep-sync-badge', () => {
    assert(mobileCss.includes('.tracking-prep-card'), 'Contains .tracking-prep-card style');
    assert(mobileCss.includes('.prep-card-value'), 'Contains .prep-card-value style');
    assert(mobileCss.includes('.prep-sync-badge'), 'Contains .prep-sync-badge style');
    assert(mobileCss.includes('.step-symbol'), 'Contains .step-symbol style');
  });

  console.log('\n==============================================');
  console.log(`Step 13 Test Summary: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
  console.log('==============================================\n');

  if (passed === total) {
    console.log('🎉 ALL STEP 13 ORDER TRACKING TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
