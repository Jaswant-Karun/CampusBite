/**
 * CampusBite - Step 24 Business Analytics Test Suite
 * Validates:
 * 1. Total Sales
 * 2. Number of orders
 * 3. Average order value (AOV)
 * 4. Most ordered products
 * 5. Peak ordering period
 * 6. Customer growth
 * 7. Coupon usage
 * 8. Completed vs cancelled orders
 * 9. Date filtering: Today, 7 Days, 30 Days
 * 10. Real database calculations
 * 11. HTML structure & KPI elements
 * 12. Frontend charts & controller methods
 */

const fs = require('fs');
const path = require('path');
const db = require('./backend/data/db');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING STEP 24: BUSINESS ANALYTICS & BI HUB');
  console.log('====================================================\n');

  // Set up local Express app for direct endpoint verification
  const express = require('express');
  const app = express();
  app.use(express.json());
  const analyticsRouter = require('./backend/routes/analytics');
  app.use('/api/analytics', analyticsRouter);

  const server = app.listen(3098);

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: Backend Analytics API Across Date Filters
    // -------------------------------------------------------------------------
    console.log('▶ Test Section 1: API Endpoint & Date Filtering (Today, 7 Days, 30 Days)');

    // 1.1 Fetch 'today'
    const todayRes = await fetch('http://localhost:3098/api/analytics?range=today');
    const todayData = await todayRes.json();
    assert(todayData.success === true && todayData.range === 'today', '1.1 GET /api/analytics?range=today returns success with range="today"');

    // 1.2 Fetch '7days'
    const weekRes = await fetch('http://localhost:3098/api/analytics?range=7days');
    const weekData = await weekRes.json();
    assert(weekData.success === true && weekData.range === '7days', '1.2 GET /api/analytics?range=7days returns success with range="7days"');

    // 1.3 Fetch '30days'
    const monthRes = await fetch('http://localhost:3098/api/analytics?range=30days');
    const monthData = await monthRes.json();
    assert(monthData.success === true && monthData.range === '30days', '1.3 GET /api/analytics?range=30days returns success with range="30days"');

    // -------------------------------------------------------------------------
    // TEST SECTION 2: The 8 Core Business Analytics Requirements
    // -------------------------------------------------------------------------
    console.log('\n▶ Test Section 2: Validation of All 8 Core Analytics Requirements');

    const an = weekData.analytics;
    assert(an !== undefined, '2.0 Analytics response contains .analytics root object');

    // Requirement 1: Total sales
    assert(typeof an.total_sales === 'number' && an.total_sales > 0 && typeof an.formatted_total_sales === 'string', 
      `2.1 Total sales calculated (₹${an.total_sales}, formatted: "${an.formatted_total_sales}")`);

    // Requirement 2: Number of orders
    assert(typeof an.total_orders === 'number' && an.total_orders > 0, 
      `2.2 Number of orders calculated (${an.total_orders} orders)`);

    // Requirement 3: Average order value (AOV)
    assert(typeof an.avg_order_value === 'number' && an.avg_order_value > 0, 
      `2.3 Average order value (AOV) calculated (₹${an.avg_order_value})`);

    // Requirement 4: Most ordered products
    assert(Array.isArray(an.most_ordered_products) && an.most_ordered_products.length > 0 && an.most_ordered_product.name, 
      `2.4 Most ordered products list provided (Top: "${an.most_ordered_product.name}" with ${an.most_ordered_product.sales_count} units sold)`);

    // Requirement 5: Peak ordering period
    assert(an.peak_ordering_period && an.peak_ordering_period.label && Array.isArray(an.peak_ordering_period.hourly_breakdown), 
      `2.5 Peak ordering period identified ("${an.peak_ordering_period.label}") with hourly breakdown`);

    // Requirement 6: Customer growth
    assert(an.customer_growth && typeof an.customer_growth.active_customers === 'number' && Array.isArray(an.customer_growth.trend), 
      `2.6 Customer growth calculated (${an.customer_growth.active_customers} active diners, trend data provided)`);

    // Requirement 7: Coupon usage
    assert(an.coupon_usage && typeof an.coupon_usage.coupon_orders_count === 'number' && Array.isArray(an.coupon_usage.coupons_breakdown), 
      `2.7 Coupon usage calculated (${an.coupon_usage.coupon_orders_count} redemptions, ₹${an.coupon_usage.total_discount_disbursed} discounts saved)`);

    // Requirement 8: Completed vs cancelled orders
    assert(an.order_fulfillment && typeof an.order_fulfillment.completed === 'number' && typeof an.order_fulfillment.cancelled === 'number' && typeof an.order_fulfillment.fulfillment_rate === 'number', 
      `2.8 Completed vs cancelled orders calculated (${an.order_fulfillment.completed} completed, ${an.order_fulfillment.cancelled} cancelled, ${an.order_fulfillment.fulfillment_rate}% fulfillment rate)`);

    // -------------------------------------------------------------------------
    // TEST SECTION 3: Accuracy Against Actual Database Information
    // -------------------------------------------------------------------------
    console.log('\n▶ Test Section 3: Verification Against Live Database Information');

    // All orders verification
    const allRes = await fetch('http://localhost:3098/api/analytics?range=all');
    const allData = await allRes.json();
    const allAn = allData.analytics;

    const dbOrders = db.data.orders || [];
    const nonCancelledDb = dbOrders.filter(o => (o.order_status || '').toLowerCase() !== 'cancelled');
    const expectedSales = nonCancelledDb.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    assert(allAn.total_orders === dbOrders.length, `3.1 Total orders in API (${allAn.total_orders}) matches DB orders count (${dbOrders.length})`);
    assert(allAn.total_sales === expectedSales, `3.2 Total sales in API (₹${allAn.total_sales}) strictly matches DB non-cancelled sales (₹${expectedSales})`);

    const expectedAov = Math.round(expectedSales / nonCancelledDb.length);
    assert(allAn.avg_order_value === expectedAov, `3.3 AOV in API (₹${allAn.avg_order_value}) strictly matches DB AOV (₹${expectedAov})`);

    // -------------------------------------------------------------------------
    // TEST SECTION 4: Frontend HTML, KPI Cards & Chart Containers
    // -------------------------------------------------------------------------
    console.log('\n▶ Test Section 4: Frontend HTML UI & KPI Cards');

    const adminHtml = fs.readFileSync(path.join(__dirname, 'frontend', 'admin.html'), 'utf8');

    assert(adminHtml.includes('id="admin-tab-analytics"'), '4.1 Admin tab panel #admin-tab-analytics exists');
    assert(adminHtml.includes('id="analytics-date-filters"'), '4.2 Date filter segmented control exists');
    assert(adminHtml.includes('data-range="today"') && adminHtml.includes('data-range="7days"') && adminHtml.includes('data-range="30days"'), 
      '4.3 Date range buttons (Today, 7 Days, 30 Days) exist in admin.html');

    // Check all 8 KPI Card Elements
    const kpiIds = [
      'analytics-kpi-sales',
      'analytics-kpi-orders',
      'analytics-kpi-aov',
      'analytics-kpi-top-product',
      'analytics-kpi-peak-hour',
      'analytics-kpi-customers',
      'analytics-kpi-coupons',
      'analytics-kpi-fulfillment'
    ];
    const allKpiPresent = kpiIds.every(id => adminHtml.includes(`id="${id}"`));
    assert(allKpiPresent, `4.4 All 8 required KPI card value elements exist (${kpiIds.join(', ')})`);

    // Check Chart Containers
    const chartContainers = [
      'analytics-revenue-trend-canvas',
      'admin-top-selling-list',
      'hourly-demand-chart-canvas',
      'fulfillment-donut-canvas',
      'customer-growth-chart-canvas',
      'coupon-breakdown-canvas'
    ];
    const allChartsPresent = chartContainers.every(id => adminHtml.includes(`id="${id}"`));
    assert(allChartsPresent, `4.5 All 6 chart and visualization containers exist (${chartContainers.join(', ')})`);

    // -------------------------------------------------------------------------
    // TEST SECTION 5: Frontend Charts & Controller Methods
    // -------------------------------------------------------------------------
    console.log('\n▶ Test Section 5: Frontend Charts & Controller Methods');

    const chartsJs = fs.readFileSync(path.join(__dirname, 'frontend', 'js', 'charts.js'), 'utf8');
    const adminJs = fs.readFileSync(path.join(__dirname, 'frontend', 'js', 'admin.js'), 'utf8');

    assert(chartsJs.includes('renderRevenueTrend') && chartsJs.includes('renderHourlyDemand') && chartsJs.includes('renderFulfillmentDonut'), 
      '5.1 CampusCharts has renderRevenueTrend, renderHourlyDemand, and renderFulfillmentDonut');

    assert(chartsJs.includes('renderCustomerGrowth') && chartsJs.includes('renderTopProductsChart') && chartsJs.includes('renderCouponBreakdown'), 
      '5.2 CampusCharts has renderCustomerGrowth, renderTopProductsChart, and renderCouponBreakdown');

    assert(adminJs.includes('setAnalyticsRange') && adminJs.includes('loadAnalytics') && adminJs.includes('renderAnalyticsPage'), 
      '5.3 AdminApp controller has setAnalyticsRange, loadAnalytics, and renderAnalyticsPage');

    console.log('\n====================================================');
    console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Fatal test error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
