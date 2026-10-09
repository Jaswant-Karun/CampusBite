/**
 * CampusBite Automated Verification Suite — Step 17 (Notification System)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./server');

function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const reqOptions = {
      hostname: '127.0.0.1',
      port: address.port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING STEP 17 NOTIFICATION SYSTEM TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  try {
    // TEST 1: GET /api/notifications returns list with required fields
    const resList = await makeRequest(server, { path: '/api/notifications?role=student&userId=u-101' });
    assert(resList.status === 200 && resList.data.success, 'GET /api/notifications returns 200 with success: true');
    assert(Array.isArray(resList.data.notifications) && resList.data.notifications.length > 0, 'Notifications list is non-empty');

    const sample = resList.data.notifications[0];
    assert(sample && sample.title !== undefined, 'Notification contains title');
    assert(sample && sample.message !== undefined, 'Notification contains message');
    assert(sample && sample.created_at !== undefined, 'Notification contains timestamp (created_at)');
    assert(sample && sample.read !== undefined, 'Notification contains read/unread status (read)');

    // TEST 2: Seed records cover the 5 required notification scenarios
    const allNotifs = resList.data.notifications;
    const hasConfirmed = allNotifs.some(n => n.type === 'ORDER_CONFIRMED' || n.title.includes('Confirmed'));
    const hasPreparing = allNotifs.some(n => n.type === 'ORDER_PREPARING' || n.title.includes('Prepared') || n.title.includes('Preparing'));
    const hasReady = allNotifs.some(n => n.type === 'ORDER_READY' || n.title.includes('Ready'));
    const hasCompleted = allNotifs.some(n => n.type === 'ORDER_COMPLETED' || n.title.includes('Completed'));
    const hasCoupon = allNotifs.some(n => n.type === 'COUPON_AVAILABLE' || n.type === 'PROMO' || n.title.includes('Offer') || n.title.includes('Coupon'));

    assert(hasConfirmed, 'Scenario 1: Order is confirmed notification exists');
    assert(hasPreparing, 'Scenario 2: Order is being prepared notification exists');
    assert(hasReady, 'Scenario 3: Order is ready notification exists');
    assert(hasCompleted, 'Scenario 4: Order is completed notification exists');
    assert(hasCoupon, 'Scenario 5: Coupon/offer is available notification exists');

    // TEST 3: Order placement emits ORDER_CONFIRMED notification
    const orderRes = await makeRequest(server, {
      path: '/api/orders',
      method: 'POST'
    }, {
      user_id: 'u-101',
      customer_name: 'Jaswant Karun',
      items: [{ product_id: 'p-1', quantity: 1 }],
      pickup_slot: '12:30 PM – 12:45 PM',
      payment_method: 'UPI',
      payment_status: 'PAID'
    });
    assert(orderRes.status === 201 && orderRes.data.success, 'New order placed successfully');
    const newOrderId = orderRes.data.order.id;

    // Check notifications list now has the new confirmed order
    const afterOrderNotifs = await makeRequest(server, { path: '/api/notifications?role=student&userId=u-101' });
    const orderNotif = afterOrderNotifs.data.notifications.find(n => n.title.includes(newOrderId) && (n.type === 'ORDER_CONFIRMED' || n.title.includes('Confirmed')));
    assert(!!orderNotif, `Order placement triggered ORDER_CONFIRMED notification for #${newOrderId}`);
    if (orderNotif) {
      assert(orderNotif.read === false, 'Newly placed order notification is unread (read: false)');
    }

    // TEST 4: Order status update to Preparing triggers ORDER_PREPARING notification
    const prepRes = await makeRequest(server, {
      path: `/api/orders/${newOrderId}/status`,
      method: 'PUT'
    }, { status: 'Preparing' });
    assert(prepRes.status === 200 && prepRes.data.success, `Order status updated to Preparing`);

    const afterPrepNotifs = await makeRequest(server, { path: '/api/notifications?role=student&userId=u-101' });
    const prepNotif = afterPrepNotifs.data.notifications.find(n => n.title.includes(newOrderId) && n.type === 'ORDER_PREPARING');
    assert(!!prepNotif, `Status update to Preparing triggered ORDER_PREPARING notification for #${newOrderId}`);

    // TEST 5: Order status update to Ready for Pickup triggers ORDER_READY notification
    const readyRes = await makeRequest(server, {
      path: `/api/orders/${newOrderId}/status`,
      method: 'PUT'
    }, { status: 'Ready for Pickup' });
    assert(readyRes.status === 200 && readyRes.data.success, `Order status updated to Ready for Pickup`);

    const afterReadyNotifs = await makeRequest(server, { path: '/api/notifications?role=student&userId=u-101' });
    const readyNotif = afterReadyNotifs.data.notifications.find(n => n.title.includes(newOrderId) && n.type === 'ORDER_READY');
    assert(!!readyNotif, `Status update to Ready for Pickup triggered ORDER_READY notification for #${newOrderId}`);

    // TEST 6: Order status update to Completed triggers ORDER_COMPLETED notification
    const compRes = await makeRequest(server, {
      path: `/api/orders/${newOrderId}/status`,
      method: 'PUT'
    }, { status: 'Completed' });
    assert(compRes.status === 200 && compRes.data.success, `Order status updated to Completed`);

    const afterCompNotifs = await makeRequest(server, { path: '/api/notifications?role=student&userId=u-101' });
    const compNotif = afterCompNotifs.data.notifications.find(n => n.title.includes(newOrderId) && n.type === 'ORDER_COMPLETED');
    assert(!!compNotif, `Status update to Completed triggered ORDER_COMPLETED notification for #${newOrderId}`);

    // TEST 7: Coupon creation triggers COUPON_AVAILABLE notification
    const couponCode = `TESTOFFER${Date.now().toString().slice(-4)}`;
    const coupRes = await makeRequest(server, {
      path: '/api/coupons',
      method: 'POST'
    }, {
      code: couponCode,
      description: 'Exclusive 25% test discount',
      discount_type: 'percentage',
      discount_value: 25,
      minimum_order: 60
    });
    assert(coupRes.status === 201 && coupRes.data.success, `Coupon ${couponCode} created`);

    const afterCoupNotifs = await makeRequest(server, { path: '/api/notifications?role=student&userId=u-101' });
    const coupNotif = afterCoupNotifs.data.notifications.find(n => n.title.includes(couponCode) && n.type === 'COUPON_AVAILABLE');
    assert(!!coupNotif, `Coupon creation triggered COUPON_AVAILABLE notification for ${couponCode}`);

    // TEST 8: Mark single notification as read
    if (coupNotif) {
      const readSingle = await makeRequest(server, {
        path: `/api/notifications/read/${coupNotif.id}`,
        method: 'POST'
      });
      assert(readSingle.status === 200 && readSingle.data.success, `Mark single notification as read succeeded`);
      assert(readSingle.data.notification && readSingle.data.notification.read === true, 'Notification status is now read: true');
    }

    // TEST 9: Mark all notifications as read
    const readAllRes = await makeRequest(server, {
      path: '/api/notifications/read-all',
      method: 'POST'
    }, { role: 'student', userId: 'u-101' });
    assert(readAllRes.status === 200 && readAllRes.data.unreadCount === 0, `Mark all as read succeeded with unreadCount: 0`);

    const checkAllRead = await makeRequest(server, { path: '/api/notifications?role=student&userId=u-101' });
    assert(checkAllRead.data.unreadCount === 0, 'Verified unreadCount is 0 after markAllRead');

    // TEST 10: Frontend UI components verification in index.html & mobile.html
    const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
    assert(indexHtml.includes('id="notif-bell-btn"'), 'index.html contains #notif-bell-btn');
    assert(indexHtml.includes('id="notif-dropdown-panel"'), 'index.html contains #notif-dropdown-panel');
    assert(indexHtml.includes('id="notif-items-list"'), 'index.html contains #notif-items-list');
    assert(indexHtml.includes('id="screen-notifications"'), 'index.html contains #screen-notifications (Dedicated Screen)');
    assert(indexHtml.includes('id="screen-notifications-list"'), 'index.html contains #screen-notifications-list');
    assert(indexHtml.includes('data-screen="notifications"'), 'index.html contains desktop nav tab for notifications');

    const mobileHtml = fs.readFileSync(path.join(__dirname, '../frontend/mobile.html'), 'utf8');
    assert(mobileHtml.includes('id="notif-bell-btn"'), 'mobile.html contains #notif-bell-btn');
    assert(mobileHtml.includes('id="screen-notifications"'), 'mobile.html contains #screen-notifications');
    assert(mobileHtml.includes('id="screen-notifications-list"'), 'mobile.html contains #screen-notifications-list');

    const notifJs = fs.readFileSync(path.join(__dirname, '../frontend/js/notifications.js'), 'utf8');
    assert(notifJs.includes('renderScreen'), 'notifications.js implements renderScreen()');
    assert(notifJs.includes('formatTimestamp'), 'notifications.js implements formatTimestamp()');
    assert(notifJs.includes('screen-notif-status-badge'), 'notifications.js renders read/unread status badge');

    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================`);

  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests().catch(err => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
