/**
 * CampusBite - Step 11: Simulated Payment Test Suite
 * Validates simulated payment options, statuses (PAID, PENDING, FAILED),
 * plaintext card security masking, and order confirmation.
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Create test express app with orders routes & database
const db = require('./data/db');
const ordersRoutes = require('./routes/orders');

const app = express();
app.use(express.json());
app.use('/api/orders', ordersRoutes);

let testServer;
let testPort;

// Test helper for HTTP requests
function makeRequest(method, reqPath, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: testPort,
        path: reqPath,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
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
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 CAMPUSBITE STEP 11: SIMULATED PAYMENT TEST SUITE');
  console.log('====================================================\n');

  // Start ephemeral server
  await new Promise((resolve) => {
    testServer = app.listen(0, '127.0.0.1', () => {
      testPort = testServer.address().port;
      resolve();
    });
  });

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

  try {
    // ==========================================
    // 1. UI & HTML Markup Verification
    // ==========================================
    console.log('--- UI & HTML Markup Verification ---');

    const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
    const mobileHtml = fs.readFileSync(path.join(__dirname, '../frontend/mobile.html'), 'utf8');
    const studentJs = fs.readFileSync(path.join(__dirname, '../frontend/js/student.js'), 'utf8');

    test('Index.html has UPI modal with student UPI ID input and simulate buttons', () => {
      assert(indexHtml.includes('id="upi-payment-modal"'), 'Missing upi-payment-modal in index.html');
      assert(indexHtml.includes('id="upi-id-input"'), 'Missing upi-id-input in index.html');
      assert(indexHtml.includes('id="upi-confirm-pay-btn"'), 'Missing upi-confirm-pay-btn in index.html');
      assert(indexHtml.includes('id="upi-simulate-fail-btn"'), 'Missing upi-simulate-fail-btn in index.html');
    });

    test('Index.html has Card modal with Card Number, Expiry, CVV, and Masking notice', () => {
      assert(indexHtml.includes('id="card-payment-modal"'), 'Missing card-payment-modal in index.html');
      assert(indexHtml.includes('id="card-number-input"'), 'Missing card-number-input in index.html');
      assert(indexHtml.includes('id="card-expiry-input"'), 'Missing card-expiry-input in index.html');
      assert(indexHtml.includes('id="card-cvv-input"'), 'Missing card-cvv-input in index.html');
      assert(indexHtml.includes('id="card-confirm-pay-btn"'), 'Missing card-confirm-pay-btn in index.html');
      assert(indexHtml.includes('id="card-simulate-fail-btn"'), 'Missing card-simulate-fail-btn in index.html');
      assert(indexHtml.includes('never stored in plaintext'), 'Missing plaintext card security notice');
    });

    test('Mobile.html has mobile UPI and Card simulation modals', () => {
      assert(mobileHtml.includes('id="upi-payment-modal"'), 'Missing upi-payment-modal in mobile.html');
      assert(mobileHtml.includes('id="mob-upi-id-input"'), 'Missing mob-upi-id-input in mobile.html');
      assert(mobileHtml.includes('id="card-payment-modal"'), 'Missing card-payment-modal in mobile.html');
      assert(mobileHtml.includes('id="mob-card-number-input"'), 'Missing mob-card-number-input in mobile.html');
      assert(mobileHtml.includes('id="mob-card-expiry-input"'), 'Missing mob-card-expiry-input in mobile.html');
      assert(mobileHtml.includes('id="mob-card-cvv-input"'), 'Missing mob-card-cvv-input in mobile.html');
      assert(mobileHtml.includes('id="confirm-payment-status-mob"'), 'Missing confirm-payment-status-mob in mobile.html');
    });

    test('Student.js implements UPI, Card, and Cash simulation methods', () => {
      assert(studentJs.includes('showUpiSimulationModal'), 'Missing showUpiSimulationModal');
      assert(studentJs.includes('confirmUpiPayment'), 'Missing confirmUpiPayment');
      assert(studentJs.includes('showCardSimulationModal'), 'Missing showCardSimulationModal');
      assert(studentJs.includes('confirmCardPayment'), 'Missing confirmCardPayment');
      assert(studentJs.includes('formatCardNumberInput'), 'Missing formatCardNumberInput');
      assert(studentJs.includes('formatCardExpiryInput'), 'Missing formatCardExpiryInput');
      assert(studentJs.includes('PENDING'), 'Missing PENDING status handling');
      assert(studentJs.includes('FAILED'), 'Missing FAILED status handling');
      assert(studentJs.includes('PAID'), 'Missing PAID status handling');
    });

    // ==========================================
    // 2. API Simulation Endpoint Tests
    // ==========================================
    console.log('\n--- Backend Payment Simulation API Tests ---');

    await testAsync('POST /api/orders/simulate-payment (UPI success)', async () => {
      const res = await makeRequest('POST', '/api/orders/simulate-payment', {
        payment_method: 'UPI',
        upi_id: 'jaswant@okaxis',
        amount: 120
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.payment_status, 'PAID');
      assert.strictEqual(res.data.payment_method, 'UPI');
      assert.strictEqual(res.data.upi_id, 'jaswant@okaxis');
    });

    await testAsync('POST /api/orders/simulate-payment (UPI with invalid VPA returns FAILED)', async () => {
      const res = await makeRequest('POST', '/api/orders/simulate-payment', {
        payment_method: 'UPI',
        upi_id: 'invalid-vpa-without-at',
        amount: 120
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.strictEqual(res.data.payment_status, 'FAILED');
    });

    await testAsync('POST /api/orders/simulate-payment (Card success with masked format)', async () => {
      const res = await makeRequest('POST', '/api/orders/simulate-payment', {
        payment_method: 'Card',
        card_number: '4532 8920 1234 8821',
        expiry: '12/28',
        cvv: '429',
        amount: 180
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.payment_status, 'PAID');
      assert.strictEqual(res.data.payment_method, 'Card');
      assert.strictEqual(res.data.card_masked, '•••• •••• •••• 8821');
      assert.strictEqual(res.data.card_brand, 'Visa');
      // Ensure raw card details and CVV are NEVER returned or stored
      assert.strictEqual(res.data.card_number, undefined);
      assert.strictEqual(res.data.cvv, undefined);
    });

    await testAsync('POST /api/orders/simulate-payment (Simulate failure flag returns FAILED)', async () => {
      const res = await makeRequest('POST', '/api/orders/simulate-payment', {
        payment_method: 'Card',
        card_number: '4532 8920 1234 8821',
        simulate_failure: true
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.strictEqual(res.data.payment_status, 'FAILED');
    });

    await testAsync('POST /api/orders/simulate-payment (Pay at Counter / Cash marks PENDING)', async () => {
      const res = await makeRequest('POST', '/api/orders/simulate-payment', {
        payment_method: 'Cash',
        amount: 90
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.payment_status, 'PENDING');
    });

    // ==========================================
    // 3. Order Placement & Status Resolution Tests
    // ==========================================
    console.log('\n--- Order Placement & Payment Status Tests ---');

    // Step 11: Option 1 — UPI with PAID status
    await testAsync('Place order with UPI: status is PAID & order ID format #CB10xx', async () => {
      const res = await makeRequest('POST', '/api/orders', {
        user_id: 'u-101',
        customer_name: 'Jaswant Karun',
        customer_phone: '87541 59344',
        items: [{ product_id: 'p-1', name: 'Masala Dosa', price: 60, quantity: 1 }],
        payment_method: 'UPI',
        payment_status: 'PAID',
        upi_id: 'jaswant@okaxis',
        pickup_slot: '12:00 PM – 12:15 PM'
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      const order = res.data.order;
      assert(/^CB10\d+$/.test(order.id), `Order ID ${order.id} should match #CB10xx`);
      assert.strictEqual(order.payment_method, 'UPI');
      assert.strictEqual(order.payment_status, 'PAID');
      assert.strictEqual(order.upi_id, 'jaswant@okaxis');
      assert(order.pickup_slot, 'Order must have pickup slot');
    });

    // Step 11: Option 2 — Card with masked format & PAID status (Plaintext CVV/card check)
    await testAsync('Place order with Card: status is PAID, masked card saved, no plaintext sensitive info', async () => {
      await new Promise(r => setTimeout(r, 60));

      const res = await makeRequest('POST', '/api/orders', {
        user_id: 'u-101',
        customer_name: 'Jaswant Karun',
        customer_phone: '87541 59344',
        items: [{ product_id: 'p-3', name: 'Veg Grilled Sandwich', price: 65, quantity: 1 }],
        payment_method: 'Card',
        payment_status: 'PAID',
        card_number: '5421 8899 0011 4455', // Sending card number to verify backend masks it
        pickup_slot: '12:15 PM – 12:30 PM'
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      const order = res.data.order;
      assert.strictEqual(order.payment_method, 'Card');
      assert.strictEqual(order.payment_status, 'PAID');
      assert.strictEqual(order.card_masked, '•••• •••• •••• 4455');
      assert.strictEqual(order.card_brand, 'Mastercard');
      assert.strictEqual(order.card_number, undefined, 'Raw card number must NOT be saved');
      assert.strictEqual(order.cvv, undefined, 'CVV must NOT be saved');
    });

    // Step 11: Option 3 — Pay at Counter / Cash marked as PENDING
    await testAsync('Place order with Pay at Counter / Cash: status is marked as PENDING', async () => {
      await new Promise(r => setTimeout(r, 60));

      const res = await makeRequest('POST', '/api/orders', {
        user_id: 'u-101',
        customer_name: 'Jaswant Karun',
        customer_phone: '87541 59344',
        items: [{ product_id: 'p-6', name: 'Cold Coffee', price: 40, quantity: 1 }],
        payment_method: 'Cash',
        pickup_slot: '12:30 PM – 12:45 PM'
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      const order = res.data.order;
      assert.strictEqual(order.payment_method, 'Cash');
      assert.strictEqual(order.payment_status, 'PENDING');
    });

    // Step 11: FAILED payment status should reject order creation
    await testAsync('Reject order creation if payment status is FAILED', async () => {
      await new Promise(r => setTimeout(r, 60));

      const res = await makeRequest('POST', '/api/orders', {
        user_id: 'u-101',
        customer_name: 'Jaswant Karun',
        customer_phone: '87541 59344',
        items: [{ product_id: 'p-2', name: 'Chole Bhature', price: 80, quantity: 1 }],
        payment_method: 'Card',
        payment_status: 'FAILED',
        pickup_slot: '12:45 PM – 1:00 PM'
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.strictEqual(res.data.payment_status, 'FAILED');
    });

    console.log(`\n==============================================`);
    console.log(`Step 11 Test Summary: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
    console.log(`==============================================\n`);

    if (testServer) {
      testServer.close();
    }

    if (passed !== total) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } finally {
    if (testServer) {
      testServer.close();
    }
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  if (testServer) testServer.close();
  process.exit(1);
});
