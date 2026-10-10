/**
 * Test Step 18 — Admin Dashboard Verification
 * Validates backend analytics calculations, API endpoints, and admin frontend structure
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = require('./backend/server');

const PORT = 3999;
const server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}...`);
  try {
    await runTests();
    console.log('✅ ALL STEP 18 ADMIN DASHBOARD TESTS PASSED!');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    server.close();
    process.exit(1);
  }
});

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:${PORT}${path}`, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.status, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.status, headers: res.headers, text: body });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n--- 1. Testing GET /api/analytics ---');
  const analyticsRes = await request('/api/analytics');
  assert.strictEqual(analyticsRes.data.success, true, 'Analytics API should succeed');
  const kpis = analyticsRes.data.kpis;
  console.log('Returned KPIs:', kpis);

  // Validate 5 KPI cards
  assert(kpis.today_sales !== undefined, "KPI today_sales must be defined");
  assert(kpis.today_orders !== undefined, "KPI today_orders must be defined");
  assert(kpis.active_customers !== undefined, "KPI active_customers must be defined");
  assert(kpis.pending_orders !== undefined, "KPI pending_orders must be defined");
  assert(kpis.avg_rating !== undefined, "KPI avg_rating must be defined");

  // Validate that numbers are not fake defaults if database has records
  const db = require('./backend/data/db');
  const realOrders = db.data.orders;
  const realRevenue = realOrders.filter(o => o.order_status !== 'Cancelled').reduce((sum, o) => sum + (o.total_amount || 0), 0);
  console.log(`Real DB orders count: ${realOrders.length}, real sum: ₹${realRevenue}`);
  assert.strictEqual(kpis.today_orders, realOrders.length, "today_orders must equal real orders count");
  assert.strictEqual(kpis.today_sales, realRevenue, "today_sales must equal real orders sum");

  console.log('\n--- 2. Testing Order Status Overview ---');
  const statusOverview = analyticsRes.data.order_status_overview;
  console.log('Order status overview:', statusOverview);
  assert(statusOverview['Order Placed'] !== undefined, "Order Placed count required");
  assert(statusOverview['Confirmed'] !== undefined, "Confirmed count required");
  assert(statusOverview['Preparing'] !== undefined, "Preparing count required");
  assert(statusOverview['Ready for Pickup'] !== undefined, "Ready for Pickup count required");
  assert(statusOverview['Completed'] !== undefined, "Completed count required");

  const totalInBreakdown = Object.values(statusOverview).reduce((a, b) => a + b, 0);
  assert.strictEqual(totalInBreakdown, realOrders.length, "Breakdown total must equal total orders in DB");

  console.log('\n--- 3. Testing Recent Orders in Analytics ---');
  const recentOrders = analyticsRes.data.recent_orders;
  assert(Array.isArray(recentOrders), "recent_orders must be an array");
  assert(recentOrders.length > 0, "recent_orders must have entries");
  console.log(`Recent orders returned: ${recentOrders.length} (first order: #${recentOrders[0].id})`);

  console.log('\n--- 4. Testing Sales Overview Chart Data ---');
  const salesOverview = analyticsRes.data.sales_overview;
  assert(Array.isArray(salesOverview.weekly_revenue), "weekly_revenue must be an array");
  assert(Array.isArray(salesOverview.orders_by_hour), "orders_by_hour must be an array");
  console.log(`Weekly revenue days: ${salesOverview.weekly_revenue.length}, Hourly points: ${salesOverview.orders_by_hour.length}`);

  console.log('\n--- 5. Testing GET /api/analytics/customers ---');
  const custRes = await request('/api/analytics/customers');
  assert.strictEqual(custRes.data.success, true, "Customers API should succeed");
  assert(Array.isArray(custRes.data.customers), "customers must be an array");
  console.log(`Customers returned: ${custRes.data.customers.length}`);
  const firstCust = custRes.data.customers[0];
  assert(firstCust.name, "Customer name required");
  assert(firstCust.email, "Customer email required");

  console.log('\n--- 6. Verifying Frontend admin.html structure ---');
  const adminHtml = fs.readFileSync(path.join(__dirname, 'frontend', 'admin.html'), 'utf8');

  // Verify Sidebar items
  const sidebarTabs = [
    'dashboard',
    'orders',
    'products',
    'inventory',
    'customers',
    'coupons',
    'reviews',
    'analytics',
    'settings'
  ];
  sidebarTabs.forEach(tab => {
    assert(adminHtml.includes(`data-tab="${tab}"`), `Sidebar must contain data-tab="${tab}"`);
    assert(adminHtml.includes(`id="admin-tab-${tab}"`), `Admin must contain tab panel id="admin-tab-${tab}"`);
  });
  console.log('All 9 sidebar tabs and panels present.');

  // Verify 5 KPI cards
  assert(adminHtml.includes('id="kpi-sales"'), "admin.html must contain id='kpi-sales'");
  assert(adminHtml.includes('id="kpi-orders"'), "admin.html must contain id='kpi-orders'");
  assert(adminHtml.includes('id="kpi-customers"'), "admin.html must contain id='kpi-customers'");
  assert(adminHtml.includes('id="kpi-pending"'), "admin.html must contain id='kpi-pending'");
  assert(adminHtml.includes('id="kpi-rating"'), "admin.html must contain id='kpi-rating'");
  console.log('All 5 KPI cards present.');

  // Verify Recent Orders Table
  assert(adminHtml.includes('id="dashboard-recent-orders-card"'), "Recent orders card required");
  assert(adminHtml.includes('id="dashboard-recent-orders-tbody"'), "Recent orders tbody required");
  console.log('Recent orders table present.');

  // Verify Sales Overview Chart
  assert(adminHtml.includes('id="dashboard-sales-chart-card"'), "Sales chart card required");
  assert(adminHtml.includes('id="dashboard-sales-chart"'), "Sales chart wrapper required");
  console.log('Sales overview chart card present.');

  // Verify Order Status Overview
  assert(adminHtml.includes('id="dashboard-order-status-card"'), "Order status card required");
  assert(adminHtml.includes('id="dashboard-order-status-breakdown"'), "Order status breakdown list required");
  console.log('Order status overview card present.');

  console.log('\n--- 7. Verifying admin.js controller methods ---');
  const adminJs = fs.readFileSync(path.join(__dirname, 'frontend', 'js', 'admin.js'), 'utf8');
  assert(adminJs.includes('renderRecentOrdersTable'), "admin.js must implement renderRecentOrdersTable");
  assert(adminJs.includes('renderDashboardSalesChart'), "admin.js must implement renderDashboardSalesChart");
  assert(adminJs.includes('renderOrderStatusOverview'), "admin.js must implement renderOrderStatusOverview");
  assert(adminJs.includes('renderProductsTable'), "admin.js must implement renderProductsTable");
  assert(adminJs.includes('loadCustomers'), "admin.js must implement loadCustomers");
  assert(adminJs.includes('resetDemoDatabase'), "admin.js must implement resetDemoDatabase");
  assert(adminJs.includes("currentTab: 'dashboard'"), "admin.js must default to dashboard tab");
  console.log('All required controller methods and defaults present in admin.js.');
}
