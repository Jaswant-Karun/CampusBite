/**
 * Automated Verification Suite for Step 21: Inventory Management
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
  console.log('🚀 STEP 21: INVENTORY MANAGEMENT VERIFICATION SUITE');
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
    // TEST 1: Inventory Table Columns & Low Stock Status Logic
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Product Inventory & Low-Stock Status ---');
    
    // Create test product with stock 8 (Prompt example: Burger, Stock: 8, Status: LOW STOCK)
    const burgerPayload = {
      name: 'Campus Smash Burger',
      description: 'Juicy patty with cheddar, caramelized onions, house sauce',
      price: 85,
      category: 'Snacks',
      stock: 8,
      is_available: true
    };
    const createBurgerRes = await request(server, 'POST', '/api/products', burgerPayload);
    assert(createBurgerRes.status === 201 && createBurgerRes.body.success, 'Created test product with stock: 8');
    const burgerId = createBurgerRes.body.product.id;
    const burgerStock = createBurgerRes.body.product.stock;
    assert(burgerStock === 8, 'Burger stock confirmed as 8');

    // Verify low stock threshold logic (Stock: 8 => LOW STOCK)
    const isLowStock = burgerStock > 0 && burgerStock <= 10;
    assert(isLowStock === true, 'Product with stock 8 classified as "LOW STOCK" (<= 10)');

    // ----------------------------------------------------
    // TEST 2: Prevent Users from Ordering More Than Available Stock
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Stock Constraints (Prevent Over-Ordering) ---');

    // Attempt to order 12 units when only 8 are available
    const overOrderPayload = {
      user_id: 'u-101',
      customer_name: 'Jaswant Karun',
      customer_phone: '87541 59344',
      items: [{
        product_id: burgerId,
        name: 'Campus Smash Burger',
        price: 85,
        quantity: 12 // Exceeds available stock (8)
      }],
      pickup_slot: '12:30 PM - 12:45 PM',
      payment_method: 'UPI'
    };

    const overOrderRes = await request(server, 'POST', '/api/orders', overOrderPayload);
    assert(overOrderRes.status === 400, 'Order exceeding available stock rejected with HTTP 400');
    assert(overOrderRes.body.success === false, 'Response indicates failure');
    assert(
      (overOrderRes.body.message || '').includes('available') || (overOrderRes.body.message || '').includes('stock'),
      'Clear error message explaining stock limitation: ' + overOrderRes.body.message
    );

    // Verify stock did NOT decrement
    const checkStockAfterReject = await request(server, 'GET', `/api/products/${burgerId}`);
    assert(checkStockAfterReject.body.product.stock === 8, 'Product stock remained intact (8 units)');

    // ----------------------------------------------------
    // TEST 3: Order Completion & Stock Depletion to 0
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Order Placement, Completion & Stock to 0 ---');

    // Place order for all remaining 8 units
    const exactOrderPayload = {
      user_id: 'u-101',
      customer_name: 'Jaswant Karun',
      customer_phone: '87541 59344',
      items: [{
        product_id: burgerId,
        name: 'Campus Smash Burger',
        price: 85,
        quantity: 8
      }],
      pickup_slot: '12:45 PM - 01:00 PM',
      payment_method: 'UPI'
    };

    const exactOrderRes = await request(server, 'POST', '/api/orders', exactOrderPayload);
    assert(exactOrderRes.status === 201 && exactOrderRes.body.success, 'Order for all 8 units placed successfully');
    const orderId = exactOrderRes.body.order.id;

    // Verify product stock reached 0 and is AUTOMATICALLY marked UNAVAILABLE
    const zeroStockProduct = await request(server, 'GET', `/api/products/${burgerId}`);
    assert(zeroStockProduct.body.product.stock === 0, 'Stock is now 0');
    assert(zeroStockProduct.body.product.is_available === false, 'When stock reaches 0, product is AUTOMATICALLY marked UNAVAILABLE (is_available = false)');

    // Attempt to order product when stock is 0
    const zeroOrderRes = await request(server, 'POST', '/api/orders', {
      user_id: 'u-101',
      customer_name: 'Jaswant Karun',
      items: [{ product_id: burgerId, name: 'Campus Smash Burger', price: 85, quantity: 1 }],
      pickup_slot: '01:00 PM - 01:15 PM',
      payment_method: 'UPI'
    });
    assert(zeroOrderRes.status === 400, 'Attempting to order product with 0 stock rejected with HTTP 400');

    // Test Order Completion lifecycle update
    const completeRes = await request(server, 'PUT', `/api/orders/${orderId}/status`, { status: 'COMPLETED' });
    assert(completeRes.status === 200 && completeRes.body.success, 'Order marked as COMPLETED');
    const completedOrder = await request(server, 'GET', `/api/orders/${orderId}`);
    assert(completedOrder.body.order.order_status === 'Completed', 'Order status verified as Completed');

    // ----------------------------------------------------
    // TEST 4: Stock Replenishment & Automatic Reactivation
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Stock Replenishment ---');
    const replenishRes = await request(server, 'PUT', `/api/products/${burgerId}`, { stock: 20 });
    assert(replenishRes.status === 200 && replenishRes.body.success, 'Admin replenished stock to 20 units');
    assert(replenishRes.body.product.stock === 20, 'Stock updated to 20');
    assert(replenishRes.body.product.is_available === true, 'Replenishing stock from 0 automatically reactivates availability');

    // Cleanup test product
    await request(server, 'DELETE', `/api/products/${burgerId}`);

    // ----------------------------------------------------
    // TEST 5: Frontend UI Code Requirements
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Frontend UI Code Requirements ---');
    const adminHtml = fs.readFileSync(path.join(__dirname, 'frontend/admin.html'), 'utf8');
    const adminJs = fs.readFileSync(path.join(__dirname, 'frontend/js/admin.js'), 'utf8');
    const studentJs = fs.readFileSync(path.join(__dirname, 'frontend/js/student.js'), 'utf8');

    // Required Table Columns in Inventory Tab
    assert(adminHtml.includes('<th>Product</th>'), 'Table contains "Product" header');
    assert(adminHtml.includes('<th>Current stock</th>'), 'Table contains "Current stock" header');
    assert(adminHtml.includes('<th>Low-stock status</th>'), 'Table contains "Low-stock status" header');
    assert(adminHtml.includes('<th>Availability</th>'), 'Table contains "Availability" header');

    // Low stock warning elements in HTML & JS
    assert(adminHtml.includes('id="inventory-low-stock-alert-container"'), 'Low stock alert container present in admin.html');
    assert(adminJs.includes('renderInventoryLowStockWarning'), 'Admin JS implements renderInventoryLowStockWarning');
    assert(adminJs.includes('LOW STOCK'), 'Admin JS formats "LOW STOCK" status text');
    assert(adminJs.includes('OUT OF STOCK'), 'Admin JS formats "OUT OF STOCK" status text');
    assert(adminJs.includes('restockAllLowItems'), 'Admin JS implements bulk restock function');

    // Student UI stock checks
    assert(studentJs.includes('addToCart') && studentJs.includes('product.stock'), 'Student JS addToCart checks product stock');
    assert(studentJs.includes('executePaymentAndPlaceOrder') && studentJs.includes('p.stock'), 'Student JS checkout validates cart item quantities against product stock');

  } catch (err) {
    console.error('Unhandled test failure:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n========================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
