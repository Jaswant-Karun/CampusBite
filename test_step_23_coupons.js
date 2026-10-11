/**
 * Step 23 Validation Suite - Admin Coupon Management & Student Checkout Rules
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

async function runStep23Tests() {
  console.log('====================================================');
  console.log('🧪 TESTING STEP 23: ADMIN COUPON MANAGEMENT');
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
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  // Set up Express server with coupons and orders routes
  const app = express();
  app.use(cors());
  app.use(express.json());
  const couponsRouter = require('./backend/routes/coupons');
  const ordersRouter = require('./backend/routes/orders');
  app.use('/api/coupons', couponsRouter);
  app.use('/api/orders', ordersRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const BASE_URL = `http://localhost:${port}/api/coupons`;
  const ORDERS_URL = `http://localhost:${port}/api/orders`;

  try {
    // 1. BACKEND CRUD FOR COUPONS
    let testCouponId = null;
    const testCode = 'TESTSAVE30_' + Date.now();

    // 1.1 Create Coupon
    await testAsync('1.1 Admin can Create coupon with discount, expiry, min order, and max discount', async () => {
      const payload = {
        code: testCode,
        discount_type: 'percentage',
        discount_value: 30,
        minimum_order: 150,
        max_discount: 60,
        expiry_date: '2027-12-31',
        description: '30% OFF campus exam snack box',
        badge: 'Special Test',
        is_active: true
      };

      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      assert.strictEqual(res.status, 201, 'Should return 201 Created');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.coupon.code, testCode);
      assert.strictEqual(data.coupon.discount_value, 30);
      assert.strictEqual(data.coupon.minimum_order, 150);
      assert.strictEqual(data.coupon.max_discount, 60);
      assert.strictEqual(data.coupon.expiry_date, '2027-12-31');
      assert.strictEqual(data.coupon.is_active, true);

      testCouponId = data.coupon.id;
    });

    // 1.2 Edit Coupon
    await testAsync('1.2 Admin can Edit coupon rules (discount, min order, max discount, expiry)', async () => {
      assert.ok(testCouponId, 'testCouponId must exist');
      const updatePayload = {
        discount_value: 35,
        minimum_order: 180,
        max_discount: 75,
        expiry_date: '2028-06-30',
        description: 'Updated 35% OFF special'
      };

      const res = await fetch(`${BASE_URL}/${testCouponId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      assert.strictEqual(res.status, 200, 'Should return 200 OK');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.coupon.discount_value, 35);
      assert.strictEqual(data.coupon.minimum_order, 180);
      assert.strictEqual(data.coupon.max_discount, 75);
      assert.strictEqual(data.coupon.expiry_date, '2028-06-30');
    });

    // 1.3 Deactivate Coupon
    await testAsync('1.3 Admin can Deactivate coupon', async () => {
      assert.ok(testCouponId, 'testCouponId must exist');
      const res = await fetch(`${BASE_URL}/${testCouponId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false })
      });

      assert.strictEqual(res.status, 200, 'Should return 200 OK');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.coupon.is_active, false);
    });

    // 1.4 Example CAMPUS20 Verification
    await testAsync('1.4 Example CAMPUS20 has 20%, Minimum order ₹200, Maximum discount ₹50', async () => {
      const res = await fetch(BASE_URL);
      const data = await res.json();
      const campus20 = data.coupons.find(c => c.code === 'CAMPUS20');
      assert.ok(campus20, 'CAMPUS20 coupon must exist in database');
      assert.strictEqual(campus20.discount_value, 20, 'Discount must be 20%');
      assert.strictEqual(campus20.minimum_order, 200, 'Minimum order must be ₹200');
      assert.strictEqual(campus20.max_discount, 50, 'Maximum discount must be ₹50');
      assert.strictEqual(campus20.is_active, true, 'CAMPUS20 must be active');
    });

    // 1.5 Display Active and Expired Coupons
    await testAsync('1.5 GET /api/coupons returns both active and expired coupons with status indicators', async () => {
      const res = await fetch(BASE_URL);
      const data = await res.json();
      assert.ok(Array.isArray(data.coupons));
      const activeCoupons = data.coupons.filter(c => c.is_active && !c.is_expired);
      const expiredCoupons = data.coupons.filter(c => c.is_expired);
      assert.ok(activeCoupons.length > 0, 'Active coupons should exist');
      assert.ok(expiredCoupons.length > 0, 'Expired coupons (e.g. EXPIRED50) should exist and be flagged');
    });

    // 2. STUDENT CHECKOUT SAME DATABASE RULES ENFORCEMENT
    // 2.1 Student Apply: Deactivated coupon rejection
    await testAsync('2.1 Student Checkout rejects Deactivated coupon (/api/coupons/apply)', async () => {
      const res = await fetch(`${BASE_URL}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'INACTIVE15', subtotal: 250 })
      });
      assert.strictEqual(res.status, 400, 'Should reject deactivated coupon with 400');
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('deactivated'));
    });

    // 2.2 Student Apply: Expired coupon rejection
    await testAsync('2.2 Student Checkout rejects Expired coupon (/api/coupons/apply)', async () => {
      const res = await fetch(`${BASE_URL}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'EXPIRED50', subtotal: 300 })
      });
      assert.strictEqual(res.status, 400, 'Should reject expired coupon with 400');
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('expired'));
    });

    // 2.3 Student Apply: Minimum order requirement rejection
    await testAsync('2.3 Student Checkout enforces Minimum order (₹200 on CAMPUS20)', async () => {
      const res = await fetch(`${BASE_URL}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'CAMPUS20', subtotal: 150 })
      });
      assert.strictEqual(res.status, 400, 'Should reject subtotal < minimum order with 400');
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Minimum order amount of ₹200'));
    });

    // 2.4 Student Apply: Maximum discount ceiling enforcement
    await testAsync('2.4 Student Checkout caps discount at Maximum Discount (₹50 on CAMPUS20)', async () => {
      // Subtotal ₹400 -> 20% of 400 = ₹80 -> capped at ₹50
      const res = await fetch(`${BASE_URL}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'CAMPUS20', subtotal: 400 })
      });
      assert.strictEqual(res.status, 200, 'Should succeed with 200');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.discount, 50, 'Discount must be capped at max_discount ₹50');
      assert.strictEqual(data.final_total, 350, 'Final total must be 400 - 50 = 350');
    });

    // 2.5 Order Placement Route Enforces Same Rules
    await testAsync('2.5 Student Order Placement rejects expired / below-min coupons (/api/orders)', async () => {
      // Below min order
      const resBelowMin = await fetch(ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'u-101',
          items: [{ product_id: 'p-1', quantity: 1 }], // Burger ₹80 < ₹200 min
          coupon_code: 'CAMPUS20'
        })
      });
      assert.strictEqual(resBelowMin.status, 400, 'Orders route should reject subtotal below coupon minimum order');

      // Expired coupon
      const resExpired = await fetch(ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'u-101',
          items: [{ product_id: 'p-1', quantity: 3 }],
          coupon_code: 'EXPIRED50'
        })
      });
      assert.strictEqual(resExpired.status, 400, 'Orders route should reject expired coupon');
    });

    // 3. FRONTEND UI & DOM IN admin.html
    const adminHtml = fs.readFileSync(path.join(__dirname, 'frontend', 'admin.html'), 'utf8');

    test('3.1 Admin Coupons page panel (#admin-tab-coupons) with table and KPI cards exists', () => {
      assert.ok(adminHtml.includes('id="admin-tab-coupons"'), 'admin-tab-coupons must exist');
      assert.ok(adminHtml.includes('id="coupon-stat-total"'), 'coupon-stat-total must exist');
      assert.ok(adminHtml.includes('id="coupon-stat-active"'), 'coupon-stat-active must exist');
      assert.ok(adminHtml.includes('id="coupon-stat-expired"'), 'coupon-stat-expired must exist');
      assert.ok(adminHtml.includes('id="admin-coupons-tbody"'), 'admin-coupons-tbody must exist');
    });

    test('3.2 Coupons table headers display requested fields', () => {
      assert.ok(/<th>\s*Coupon Code\s*<\/th>/i.test(adminHtml), 'Coupon Code column header present');
      assert.ok(/<th>\s*Discount\s*<\/th>/i.test(adminHtml), 'Discount column header present');
      assert.ok(/<th>\s*Minimum Order\s*<\/th>/i.test(adminHtml), 'Minimum Order column header present');
      assert.ok(/<th>\s*Maximum Discount\s*<\/th>/i.test(adminHtml), 'Maximum Discount column header present');
      assert.ok(/<th>\s*Expiry Date\s*<\/th>/i.test(adminHtml), 'Expiry Date column header present');
      assert.ok(/<th>\s*Status\s*<\/th>/i.test(adminHtml), 'Status column header present');
    });

    test('3.3 Create and Edit Coupon Modals exist in admin.html', () => {
      assert.ok(adminHtml.includes('id="create-coupon-modal"'), '#create-coupon-modal present');
      assert.ok(adminHtml.includes('id="edit-coupon-modal"'), '#edit-coupon-modal present');
      assert.ok(adminHtml.includes('id="create-c-code"'), '#create-c-code present');
      assert.ok(adminHtml.includes('id="create-c-min"'), '#create-c-min present');
      assert.ok(adminHtml.includes('id="create-c-max"'), '#create-c-max present');
      assert.ok(adminHtml.includes('id="create-c-expiry"'), '#create-c-expiry present');
      assert.ok(adminHtml.includes('id="edit-c-id"'), '#edit-c-id present');
    });

    // 4. FRONTEND CONTROLLER IN admin.js & api.js
    const adminJs = fs.readFileSync(path.join(__dirname, 'frontend', 'js', 'admin.js'), 'utf8');

    test('4.1 AdminApp has complete coupon management methods', () => {
      assert.ok(adminJs.includes('loadCoupons()'), 'loadCoupons method present');
      assert.ok(adminJs.includes('renderCouponsTable()'), 'renderCouponsTable method present');
      assert.ok(adminJs.includes('openCreateCouponModal'), 'openCreateCouponModal present');
      assert.ok(adminJs.includes('handleCreateCouponSubmit'), 'handleCreateCouponSubmit present');
      assert.ok(adminJs.includes('openEditCouponModal'), 'openEditCouponModal present');
      assert.ok(adminJs.includes('handleEditCouponSubmit'), 'handleEditCouponSubmit present');
      assert.ok(adminJs.includes('toggleCouponActive'), 'toggleCouponActive present');
      assert.ok(adminJs.includes('deleteCoupon'), 'deleteCoupon present');
    });

    const apiJs = fs.readFileSync(path.join(__dirname, 'frontend', 'js', 'api.js'), 'utf8');

    test('4.2 window.api has full CRUD methods for coupons', () => {
      assert.ok(apiJs.includes('getCoupons:'), 'getCoupons present');
      assert.ok(apiJs.includes('createCoupon:'), 'createCoupon present');
      assert.ok(apiJs.includes('updateCoupon:'), 'updateCoupon present');
      assert.ok(apiJs.includes('deleteCoupon:'), 'deleteCoupon present');
      assert.ok(apiJs.includes('applyCoupon:'), 'applyCoupon present');
    });

    // Clean up test coupon
    if (testCouponId) {
      await fetch(`${BASE_URL}/${testCouponId}`, { method: 'DELETE' });
    }

  } finally {
    server.close();
  }

  console.log(`\n====================================================`);
  console.log(`🏁 TEST RESULTS: ${passed}/${total} PASSED`);
  console.log(`====================================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

runStep23Tests();
