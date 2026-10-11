/**
 * Step 22 Validation Suite - Customer Management & Diners CRM
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

async function runStep22Tests() {
  console.log('====================================================');
  console.log('🧪 TESTING STEP 22: CUSTOMER MANAGEMENT');
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

  // 1. BACKEND API ROUTES & REAL DATABASE INFORMATION
  const app = express();
  app.use(cors());
  app.use(express.json());
  const customersRouter = require('./backend/routes/customers');
  app.use('/api/customers', customersRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const BASE_URL = `http://localhost:${port}/api/customers`;

  try {
    // 1.1 Live Customer Directory
    await testAsync('1.1 GET /api/customers returns live customer directory with real database data', async () => {
      const res = await fetch(BASE_URL);
      assert.strictEqual(res.status, 200, 'Should return status 200');
      const data = await res.json();
      assert.strictEqual(data.success, true, 'success should be true');
      assert.ok(Array.isArray(data.customers), 'customers should be an array');
      assert.ok(data.customers.length >= 5, 'Should return at least 5 registered diners');
      assert.ok(data.kpis, 'KPIs object should be present');
      assert.ok(data.kpis.total_customers >= data.customers.length);
      assert.ok(data.kpis.total_spending > 0, 'Total spending should be calculated from real orders');
    });

    // 1.2 Required Display Attributes
    await testAsync('1.2 Customers list contains all required display fields (Customer, Email, Phone, Total orders, Total spending, Loyalty points, Last order)', async () => {
      const res = await fetch(BASE_URL);
      const data = await res.json();
      const customer = data.customers.find(c => c.id === 'u-101');
      assert.ok(customer, 'Customer u-101 (Jaswant Karun) should exist');

      // Check fields specified by user:
      assert.ok(customer.name, 'Field Customer/Name must exist');
      assert.ok(customer.email, 'Field Email must exist');
      assert.ok(customer.phone !== undefined, 'Field Phone if available must exist');
      assert.ok(typeof customer.total_orders === 'number', 'Field Total orders must be a number');
      assert.ok(customer.total_orders > 0, 'Customer u-101 should have real orders from db');
      assert.ok(typeof customer.total_spending === 'number', 'Field Total spending must be a number');
      assert.ok(customer.total_spending > 0, 'Customer u-101 should have real spending from db');
      assert.ok(typeof customer.loyalty_points === 'number', 'Field Loyalty points must be a number');
      assert.ok(customer.last_order, 'Field Last order should exist for customer with orders');
      assert.ok(customer.last_order.id, 'Last order must contain order ID');
    });

    // 1.3 Search Filter Query
    await testAsync('1.3 GET /api/customers?search=... filters diners by name/email/phone', async () => {
      const res = await fetch(`${BASE_URL}?search=Jaswant`);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.customers.length >= 1, 'Should find customer with name Jaswant');
      assert.ok(data.customers.every(c => c.name.toLowerCase().includes('jaswant')));

      const phoneRes = await fetch(`${BASE_URL}?search=98401`);
      const phoneData = await phoneRes.json();
      assert.ok(phoneData.customers.some(c => c.name.includes('Priya')), 'Should find Dr. Priya by phone');
    });

    // 1.4 Role & Activity Filter Queries
    await testAsync('1.4 GET /api/customers?role=faculty and ?activity=active filter properly', async () => {
      const facultyRes = await fetch(`${BASE_URL}?role=faculty`);
      const facultyData = await facultyRes.json();
      assert.ok(facultyData.customers.every(c => c.role === 'faculty'));

      const activeRes = await fetch(`${BASE_URL}?activity=active`);
      const activeData = await activeRes.json();
      assert.ok(activeData.customers.every(c => c.total_orders > 0));
    });

    // 1.5 Customer Details View with Order History
    await testAsync('1.5 GET /api/customers/:id returns customer details view with complete order history', async () => {
      const res = await fetch(`${BASE_URL}/u-101`);
      assert.strictEqual(res.status, 200, 'Should return status 200');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      const c = data.customer;
      assert.ok(c, 'customer object should exist');
      assert.strictEqual(c.id, 'u-101');
      assert.ok(Array.isArray(c.order_history), 'order_history must be an array');
      assert.ok(c.order_history.length > 0, 'order_history should contain real database orders');

      // Verify structure of orders in history
      const firstOrder = c.order_history[0];
      assert.ok(firstOrder.id, 'Order must have id');
      assert.ok(Array.isArray(firstOrder.items), 'Order must have items array');
      assert.ok(firstOrder.total_amount > 0, 'Order must have total_amount');
      assert.ok(firstOrder.order_status, 'Order must have order_status');
    });

    // 2. FRONTEND DOM STRUCTURE IN admin.html
    const adminHtml = fs.readFileSync(path.join(__dirname, 'frontend', 'admin.html'), 'utf8');

    test('2.1 Admin Customers page panel (#admin-tab-customers) exists in admin.html', () => {
      assert.ok(adminHtml.includes('id="admin-tab-customers"'), 'admin-tab-customers must be present');
      assert.ok(adminHtml.includes('id="admin-customers-tbody"'), 'admin-customers-tbody must be present');
    });

    test('2.2 Customers table headers display exact requested fields', () => {
      assert.ok(/<th>\s*Customer\s*<\/th>/i.test(adminHtml), 'Customer column header present');
      assert.ok(/<th>\s*Email\s*<\/th>/i.test(adminHtml), 'Email column header present');
      assert.ok(/<th>\s*Phone\s*<\/th>/i.test(adminHtml), 'Phone column header present');
      assert.ok(/<th>\s*Total orders\s*<\/th>/i.test(adminHtml), 'Total orders column header present');
      assert.ok(/<th>\s*Total spending\s*<\/th>/i.test(adminHtml), 'Total spending column header present');
      assert.ok(/<th>\s*Loyalty points\s*<\/th>/i.test(adminHtml), 'Loyalty points column header present');
      assert.ok(/<th>\s*Last order\s*<\/th>/i.test(adminHtml), 'Last order column header present');
    });

    test('2.3 Search & filter controls exist on Admin Customers page', () => {
      assert.ok(adminHtml.includes('id="customer-search-input"'), 'Search input #customer-search-input present');
      assert.ok(adminHtml.includes('id="customer-role-filter"'), 'Role filter #customer-role-filter present');
      assert.ok(adminHtml.includes('id="customer-activity-filter"'), 'Activity filter #customer-activity-filter present');
      assert.ok(adminHtml.includes('id="customer-sort-filter"'), 'Sort filter #customer-sort-filter present');
      assert.ok(adminHtml.includes('id="customer-reset-btn"'), 'Clear filter button #customer-reset-btn present');
    });

    test('2.4 Customer details view modal (#customer-details-modal) with order history exists', () => {
      assert.ok(adminHtml.includes('id="customer-details-modal"'), 'Modal #customer-details-modal present');
      assert.ok(adminHtml.includes('id="cust-modal-orders-container"'), 'Order history container present');
      assert.ok(adminHtml.includes('id="cust-modal-email"'), 'Email display in modal present');
      assert.ok(adminHtml.includes('id="cust-modal-phone"'), 'Phone display in modal present');
      assert.ok(adminHtml.includes('id="cust-modal-points"'), 'Loyalty points in modal present');
    });

    // 3. FRONTEND CONTROLLER METHODS IN admin.js
    const adminJs = fs.readFileSync(path.join(__dirname, 'frontend', 'js', 'admin.js'), 'utf8');

    test('3.1 AdminApp has customer management methods (loadCustomers, renderCustomersTable, search, filters)', () => {
      assert.ok(adminJs.includes('loadCustomers()'), 'loadCustomers() method present');
      assert.ok(adminJs.includes('renderCustomersTable()'), 'renderCustomersTable() method present');
      assert.ok(adminJs.includes('handleCustomerSearch'), 'handleCustomerSearch method present');
      assert.ok(adminJs.includes('handleCustomerFilterChange'), 'handleCustomerFilterChange method present');
      assert.ok(adminJs.includes('clearCustomerFilters'), 'clearCustomerFilters method present');
    });

    test('3.2 AdminApp has customer details view and order history rendering', () => {
      assert.ok(adminJs.includes('openCustomerDetails'), 'openCustomerDetails method present');
      assert.ok(adminJs.includes('renderCustomerOrderHistory'), 'renderCustomerOrderHistory method present');
    });

    // 4. API CLIENT SERVICE IN api.js
    const apiJs = fs.readFileSync(path.join(__dirname, 'frontend', 'js', 'api.js'), 'utf8');

    test('4.1 window.api has getCustomers and getCustomerDetails', () => {
      assert.ok(apiJs.includes('getCustomers:'), 'window.api.getCustomers present');
      assert.ok(apiJs.includes('getCustomerDetails:'), 'window.api.getCustomerDetails present');
    });

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

runStep22Tests();
