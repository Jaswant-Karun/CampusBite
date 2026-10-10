/**
 * Comprehensive Automated Test Suite for Step 19: Admin Order Management
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./backend/server');
const db = require('./backend/data/db');

function request(server, method, urlPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: port,
        path: urlPath,
        method: method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('🚀 STEP 19: ADMIN ORDER MANAGEMENT VERIFICATION SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  try {
    // ----------------------------------------------------
    // TEST 1: Orders API returns real database data with all 8 fields
    // ----------------------------------------------------
    console.log('\n--- 1. Testing GET /api/orders & Data Structure ---');
    const resOrders = await request(server, 'GET', '/api/orders');
    assert(resOrders.status === 200, 'GET /api/orders returned status 200');
    assert(resOrders.body.success === true, 'Response indicates success = true');
    assert(Array.isArray(resOrders.body.orders), 'Orders list is an array');
    assert(resOrders.body.orders.length > 0, `Database contains ${resOrders.body.orders.length} real orders`);

    const sampleOrder = resOrders.body.orders[0];
    assert(sampleOrder.id !== undefined, `1. Order ID present: #${sampleOrder.id}`);
    assert(sampleOrder.customer_name !== undefined, `2. Customer present: ${sampleOrder.customer_name}`);
    assert(Array.isArray(sampleOrder.items) && sampleOrder.items.length > 0, `3. Items list present: ${sampleOrder.items.length} items`);
    assert(sampleOrder.total_amount !== undefined, `4. Amount present: ₹${sampleOrder.total_amount}`);
    assert(sampleOrder.payment_method !== undefined && sampleOrder.payment_status !== undefined, `5. Payment present: ${sampleOrder.payment_method} (${sampleOrder.payment_status})`);
    assert(sampleOrder.pickup_slot !== undefined, `6. Pickup Slot present: ${sampleOrder.pickup_slot}`);
    assert(sampleOrder.order_status !== undefined, `7. Status present: ${sampleOrder.order_status}`);
    assert(sampleOrder.created_at !== undefined, `8. Created Time present: ${sampleOrder.created_at}`);

    // ----------------------------------------------------
    // TEST 2: Status Lifecycle Progression
    // PENDING → CONFIRMED → PREPARING → READY → COMPLETED
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Order Lifecycle Transitions ---');
    // Create or select an active order to transition
    const testOrderId = sampleOrder.id;

    // Reset to PENDING / Order Placed
    let statusRes = await request(server, 'PUT', `/api/orders/${testOrderId}/status`, { status: 'PENDING' });
    assert(statusRes.status === 200 && statusRes.body.success, 'Transition to PENDING succeeded');
    let getRes = await request(server, 'GET', `/api/orders/${testOrderId}`);
    assert(getRes.body.order.order_status === 'Order Placed', 'Order status verified as "Order Placed"');

    // CONFIRMED
    statusRes = await request(server, 'PUT', `/api/orders/${testOrderId}/status`, { status: 'CONFIRMED' });
    assert(statusRes.status === 200 && statusRes.body.success, 'Transition to CONFIRMED succeeded');
    getRes = await request(server, 'GET', `/api/orders/${testOrderId}`);
    assert(getRes.body.order.order_status === 'Confirmed', 'Order status verified as "Confirmed"');

    // PREPARING
    statusRes = await request(server, 'PUT', `/api/orders/${testOrderId}/status`, { status: 'PREPARING' });
    assert(statusRes.status === 200 && statusRes.body.success, 'Transition to PREPARING succeeded');
    getRes = await request(server, 'GET', `/api/orders/${testOrderId}`);
    assert(getRes.body.order.order_status === 'Preparing', 'Order status verified as "Preparing"');

    // READY
    statusRes = await request(server, 'PUT', `/api/orders/${testOrderId}/status`, { status: 'READY' });
    assert(statusRes.status === 200 && statusRes.body.success, 'Transition to READY succeeded');
    getRes = await request(server, 'GET', `/api/orders/${testOrderId}`);
    assert(getRes.body.order.order_status === 'Ready for Pickup', 'Order status verified as "Ready for Pickup"');

    // COMPLETED
    statusRes = await request(server, 'PUT', `/api/orders/${testOrderId}/status`, { status: 'COMPLETED' });
    assert(statusRes.status === 200 && statusRes.body.success, 'Transition to COMPLETED succeeded');
    getRes = await request(server, 'GET', `/api/orders/${testOrderId}`);
    assert(getRes.body.order.order_status === 'Completed', 'Order status verified as "Completed"');

    // ----------------------------------------------------
    // TEST 3: CANCELLED transition & Stock Restock Verification
    // ----------------------------------------------------
    console.log('\n--- 3. Testing CANCELLED Transition & Inventory Restock ---');
    // Find a product and record initial stock
    const productsRes = await request(server, 'GET', '/api/products');
    const targetProduct = productsRes.body.products[0];
    const initialStock = targetProduct.stock;

    // Create a new order for 2 units of this product
    const newOrderPayload = {
      user_id: 'u-101',
      customer_name: 'Test Student',
      customer_email: 'test@campus.edu',
      customer_phone: '9876543210',
      items: [{
        product_id: targetProduct.id,
        name: targetProduct.name,
        price: targetProduct.price,
        quantity: 2
      }],
      subtotal: targetProduct.price * 2,
      discount_amount: 0,
      total_amount: targetProduct.price * 2,
      pickup_slot: '12:30 PM - 12:45 PM',
      pickup_counter: 1,
      payment_method: 'UPI',
      notes: 'Step 19 Verification Order'
    };

    const createOrderRes = await request(server, 'POST', '/api/orders', newOrderPayload);
    assert(createOrderRes.status === 201 && createOrderRes.body.success, 'New order placed successfully');
    const createdOrderId = createOrderRes.body.order.id;

    // Verify stock decreased by 2
    const prodsAfterOrder = await request(server, 'GET', '/api/products');
    const prodAfter = prodsAfterOrder.body.products.find(p => p.id === targetProduct.id);
    assert(prodAfter.stock === initialStock - 2, `Stock deducted after placing order (${initialStock} -> ${prodAfter.stock})`);

    // Admin cancels the order
    const cancelRes = await request(server, 'PUT', `/api/orders/${createdOrderId}/status`, { status: 'CANCELLED' });
    assert(cancelRes.status === 200 && cancelRes.body.success, 'Admin cancelled order successfully');

    // Verify order status is Cancelled
    const checkCancelled = await request(server, 'GET', `/api/orders/${createdOrderId}`);
    assert(checkCancelled.body.order.order_status === 'Cancelled', 'Order status verified as "Cancelled"');

    // Verify stock has been restored by 2
    const prodsAfterCancel = await request(server, 'GET', '/api/products');
    const prodRestored = prodsAfterCancel.body.products.find(p => p.id === targetProduct.id);
    assert(prodRestored.stock === initialStock, `Stock restored upon cancellation (${prodAfter.stock} -> ${prodRestored.stock})`);

    // ----------------------------------------------------
    // TEST 4: Student Tracking API Update Verification
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Student Order Tracking Sync API ---');
    // Set status to Ready for Pickup
    await request(server, 'PUT', `/api/orders/${testOrderId}/status`, { status: 'Ready for Pickup' });
    const studentTrackRes = await request(server, 'GET', `/api/orders/${testOrderId}`);
    assert(studentTrackRes.body.order.order_status === 'Ready for Pickup', 'Student tracking receives updated status "Ready for Pickup"');

    // Set status to Completed
    await request(server, 'PUT', `/api/orders/${testOrderId}/status`, { status: 'Completed' });
    const studentTrackRes2 = await request(server, 'GET', `/api/orders/${testOrderId}`);
    assert(studentTrackRes2.body.order.order_status === 'Completed', 'Student tracking receives updated status "Completed"');

    // ----------------------------------------------------
    // TEST 5: Frontend UI Code Verification (admin.html, admin.js, student.js)
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Frontend UI Code Requirements ---');
    const adminHtml = fs.readFileSync(path.join(__dirname, 'frontend/admin.html'), 'utf8');
    const adminJs = fs.readFileSync(path.join(__dirname, 'frontend/js/admin.js'), 'utf8');
    const studentJs = fs.readFileSync(path.join(__dirname, 'frontend/js/student.js'), 'utf8');

    // 8 Required Table Headers
    const requiredHeaders = [
      'Order ID',
      'Customer',
      'Items',
      'Amount',
      'Payment',
      'Pickup Slot',
      'Status',
      'Created Time'
    ];
    requiredHeaders.forEach(header => {
      assert(adminHtml.includes(`<th>${header}</th>`), `Admin table contains column header: <th>${header}</th>`);
    });

    // 4 Search/Filter Inputs
    assert(adminHtml.includes('id="order-search-id"'), 'Order ID search input present (#order-search-id)');
    assert(adminHtml.includes('id="order-search-customer"'), 'Customer search input present (#order-search-customer)');
    assert(adminHtml.includes('id="order-filter-status"'), 'Status dropdown filter present (#order-filter-status)');
    assert(adminHtml.includes('id="order-filter-date"'), 'Date filter input present (#order-filter-date)');

    // Status filter options: PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED
    const filterOptions = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    filterOptions.forEach(opt => {
      assert(adminHtml.includes(opt), `Status filter dropdown contains option: ${opt}`);
    });

    // Admin JS logic: Confirmation on destructive actions
    assert(adminJs.includes('confirmCancelOrder') && adminJs.includes('confirm('), 'Confirmation prompt present before cancelling order');
    assert(adminJs.includes('advanceOrderStatus'), 'Order status advancement method present');
    assert(adminJs.includes('campusbite_order_update'), 'Cross-window storage event emitted on status change');

    // Student JS: Real-time sync listener
    assert(studentJs.includes('campusbite_order_update'), 'Student.js listens for campusbite_order_update via storage event');
    assert(studentJs.includes('campusbite:order_updated') || studentJs.includes('campusbite:orderStatusChanged'), 'Student.js listens for in-window custom order update event');
    assert(studentJs.includes("rawStatus === 'cancelled'"), 'Student tracking handles and displays cancelled order state');

  } catch (err) {
    console.error('Unhandled test failure:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n========================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
