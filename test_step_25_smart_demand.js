/**
 * CampusBite - Step 25 Smart Demand Insight Test Suite
 * Validates:
 * 1. Backend /api/smart-demand & /api/demand-prediction endpoints
 * 2. Transparent statistical/rule-based approach (no AI exaggerations)
 * 3. Historical data analysis (product orders, day, time, order volume)
 * 4. Demand levels: HIGH DEMAND, MEDIUM DEMAND, LOW DEMAND
 * 5. Explaining why each insight was generated
 * 6. Decision support for: preparation, inventory, staffing, reducing food waste
 * 7. Key requested examples:
 *    - "Burger demand is expected to be HIGH around 12:30 PM."
 *    - "Friday lunch has higher order volume than the weekly average."
 *    - "Juice sales increased by 18% this week."
 * 8. Kitchen prep update endpoint (/apply-prep)
 * 9. Frontend admin.html sidebar, tab panel, and KPI summary strips
 * 10. Frontend admin.js controller and api.js client methods
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

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
  console.log('🧪 TESTING STEP 25: SMART DEMAND INSIGHT');
  console.log('====================================================\n');

  // Launch local test server on port 3097
  const app = express();
  app.use(express.json());
  const demandRoutes = require('./backend/routes/demandPrediction');
  app.use('/api/smart-demand', demandRoutes);
  app.use('/api/demand-prediction', demandRoutes);

  const server = app.listen(3097);

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: Backend Endpoint & Transparent Statistical Attribution
    // -------------------------------------------------------------------------
    console.log('▶ Test Section 1: Endpoint & Transparent Methodology');

    const res = await fetch('http://localhost:3097/api/smart-demand');
    const data = await res.json();

    assert(data.success === true && Array.isArray(data.insights), '1.1 GET /api/smart-demand returns success with insights array');
    assert(data.feature === 'Smart Demand Insight', '1.2 Feature name is "Smart Demand Insight"');
    assert(data.attribution_notice && data.attribution_notice.includes('Rule-based') && !data.methodology.includes('Deep Neural Network'), 
      '1.3 Transparent attribution: Clearly specifies rule-based statistical decision support without false AI claims');

    // -------------------------------------------------------------------------
    // TEST SECTION 2: Core Prompt Examples Present
    // -------------------------------------------------------------------------
    console.log('\n▶ Test Section 2: Concrete Requested Insights Present');

    const titles = data.insights.map(i => i.title);

    const hasBurger = titles.some(t => t.includes('Burger demand is expected to be HIGH around 12:30 PM'));
    assert(hasBurger, '2.1 Contains insight: "Burger demand is expected to be HIGH around 12:30 PM."');

    const hasFriday = titles.some(t => t.includes('Friday lunch has higher order volume than the weekly average'));
    assert(hasFriday, '2.2 Contains insight: "Friday lunch has higher order volume than the weekly average."');

    const hasJuice = titles.some(t => t.includes('Juice sales increased by 18% this week'));
    assert(hasJuice, '2.3 Contains insight: "Juice sales increased by 18% this week."');

    // -------------------------------------------------------------------------
    // TEST SECTION 3: Demand Levels (HIGH, MEDIUM, LOW DEMAND)
    // -------------------------------------------------------------------------
    console.log('\n▶ Test Section 3: Demand Level Classifications');

    const demandLevels = new Set(data.insights.map(i => i.demand_level));

    assert(demandLevels.has('HIGH DEMAND'), '3.1 Displays "HIGH DEMAND" badge');
    assert(demandLevels.has('MEDIUM DEMAND'), '3.2 Displays "MEDIUM DEMAND" badge');
    assert(demandLevels.has('LOW DEMAND'), '3.3 Displays "LOW DEMAND" badge');

    // -------------------------------------------------------------------------
    // TEST SECTION 4: Historical Variables & Explanation of Why Insight Was Generated
    // -------------------------------------------------------------------------
    console.log('\n▶ Test Section 4: Historical Basis & Statistical Explanation');

    const sampleInsight = data.insights.find(i => i.demand_level === 'HIGH DEMAND');
    const basis = sampleInsight.historical_basis;

    assert(basis && basis.product_orders && basis.day && basis.time && basis.order_volume, 
      '4.1 Historical basis includes: product orders, day, time, and order volume');

    const allHaveExplanations = data.insights.every(i => typeof i.explanation === 'string' && i.explanation.length > 30);
    assert(allHaveExplanations, '4.2 Explains why the insight was generated for all insights');

    // -------------------------------------------------------------------------
    // TEST SECTION 5: Decision Support for the 4 Operational Areas
    // -------------------------------------------------------------------------
    console.log('\n▶ Test Section 5: Decision Support Across 4 Key Areas');

    const allHaveDecisionSupport = data.insights.every(i => {
      const ds = i.decision_support;
      return ds && ds.preparation && ds.inventory && ds.staffing && ds.food_waste;
    });

    assert(allHaveDecisionSupport, '5.1 Provides decision support for: preparation, inventory, staffing, and reducing food waste');

    // -------------------------------------------------------------------------
    // TEST SECTION 6: Kitchen Prep Action Endpoint
    // -------------------------------------------------------------------------
    console.log('\n▶ Test Section 6: Kitchen Prep Action Route');

    const prepRes = await fetch('http://localhost:3097/api/smart-demand/apply-prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'p-1', prepAmount: 15 })
    });
    const prepData = await prepRes.json();
    assert(prepData.success === true && prepData.product.id === 'p-1', '6.1 POST /api/smart-demand/apply-prep updates stock successfully');

    // -------------------------------------------------------------------------
    // TEST SECTION 7: Frontend DOM & Admin Portal Structure
    // -------------------------------------------------------------------------
    console.log('\n▶ Test Section 7: Frontend HTML Structure');

    const adminHtml = fs.readFileSync(path.join(__dirname, 'frontend', 'admin.html'), 'utf8');

    assert(adminHtml.includes('data-tab="smart-demand"'), '7.1 Sidebar navigation has "smart-demand" button');
    assert(adminHtml.includes('id="admin-tab-smart-demand"'), '7.2 Main panel #admin-tab-smart-demand exists');
    assert(adminHtml.includes('id="sdi-stat-total"') && adminHtml.includes('id="sdi-stat-high"') && adminHtml.includes('id="sdi-stat-medium"') && adminHtml.includes('id="sdi-stat-low"'), 
      '7.3 Summary KPI counters exist (#sdi-stat-total, #sdi-stat-high, #sdi-stat-medium, #sdi-stat-low)');
    assert(adminHtml.includes('id="smart-demand-insights-grid"'), '7.4 Insights grid container #smart-demand-insights-grid exists');
    assert(adminHtml.includes('data-level="HIGH DEMAND"') && adminHtml.includes('data-level="MEDIUM DEMAND"') && adminHtml.includes('data-level="LOW DEMAND"'), 
      '7.5 Demand level filter buttons exist in admin.html');

    // -------------------------------------------------------------------------
    // TEST SECTION 8: Frontend JS Client & Controller Methods
    // -------------------------------------------------------------------------
    console.log('\n▶ Test Section 8: Frontend Controller & API Integration');

    const apiJs = fs.readFileSync(path.join(__dirname, 'frontend', 'js', 'api.js'), 'utf8');
    const adminJs = fs.readFileSync(path.join(__dirname, 'frontend', 'js', 'admin.js'), 'utf8');

    assert(apiJs.includes('getSmartDemandInsights'), '8.1 window.api has getSmartDemandInsights()');
    assert(adminJs.includes('loadSmartDemandInsights') && adminJs.includes('filterDemandInsights') && adminJs.includes('renderSmartDemandInsights'), 
      '8.2 AdminApp has loadSmartDemandInsights, filterDemandInsights, and renderSmartDemandInsights');

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
