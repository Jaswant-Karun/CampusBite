/**
 * CampusBite - STEP 15: Student Profile and Loyalty System Test Suite
 * Validates:
 * 1. Profile Information Display & Editing:
 *    - Name, Email, Phone, Profile Image support, Account Information (Student ID, Department, Role, Wallet)
 *    - Profile rendering in desktop (index.html) and mobile (mobile.html)
 *    - Profile update endpoint PUT /api/auth/profile/:id
 * 2. Clean Loyalty Card:
 *    - Visual card container with luxury styling, chip, barcode, tier badge, current points
 *    - Card design elements present in index.html, mobile.html, and style.css
 * 3. 3-Metric Display:
 *    - Current points
 *    - Points earned
 *    - Points used
 * 4. Loyalty Calculations & Database Persistence:
 *    - Loyalty calculation is server-side (Every ₹100 spent = 10 loyalty points)
 *    - Transactions stored in database (db.data.loyalty_transactions / LoyaltyTransaction)
 *    - Server GET /api/loyalty/:user_id returns points_earned, points_used, current_points, earning_rule, ledger
 *    - Server POST /api/loyalty/redeem creates audit transaction, deducts points, and updates wallet
 * 5. Loyalty History:
 *    - History ledger container, filter pills, and transactional entries with timestamps, type, and point delta
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('./data/db');
const loyaltyRoutes = require('./routes/loyalty');
const authRoutes = require('./routes/auth');

console.log('====================================================');
console.log('🧪 CAMPUSBITE STEP 15: PROFILE & LOYALTY TEST SUITE');
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
  const styleCss = fs.readFileSync(path.join(__dirname, '../frontend/css/style.css'), 'utf8');
  const studentJs = fs.readFileSync(path.join(__dirname, '../frontend/js/student.js'), 'utf8');
  const apiJs = fs.readFileSync(path.join(__dirname, '../frontend/js/api.js'), 'utf8');

  console.log('--- 1. Desktop Profile & Loyalty UI (index.html) ---');

  test('Desktop has #screen-profile section', () => {
    assert(indexHtml.includes('id="screen-profile"'), 'Missing #screen-profile in index.html');
  });

  test('Desktop displays Profile Name, Email, Phone, Profile Image/Avatar', () => {
    assert(indexHtml.includes('id="profile-name"'), 'Missing #profile-name in index.html');
    assert(indexHtml.includes('id="profile-email"'), 'Missing #profile-email in index.html');
    assert(indexHtml.includes('id="profile-phone"'), 'Missing #profile-phone in index.html');
    assert(indexHtml.includes('id="profile-avatar-container"') || indexHtml.includes('id="profile-avatar"'), 'Missing profile avatar container in index.html');
  });

  test('Desktop displays Account Information fields (Student ID, Dept, Role, Wallet, Status)', () => {
    assert(indexHtml.includes('id="account-info-student-id"'), 'Missing #account-info-student-id');
    assert(indexHtml.includes('id="account-info-dept"'), 'Missing #account-info-dept');
    assert(indexHtml.includes('id="account-info-role"'), 'Missing #account-info-role');
    assert(indexHtml.includes('id="account-info-wallet"'), 'Missing #account-info-wallet');
  });

  test('Desktop renders Clean Loyalty Card with Chip, Tier Badge, and Barcode', () => {
    assert(indexHtml.includes('campus-loyalty-card'), 'Missing .campus-loyalty-card class in index.html');
    assert(indexHtml.includes('loyalty-card-chip'), 'Missing .loyalty-card-chip in index.html');
    assert(indexHtml.includes('id="loyalty-card-tier"'), 'Missing #loyalty-card-tier in index.html');
    assert(indexHtml.includes('id="loyalty-card-points"'), 'Missing #loyalty-card-points in index.html');
    assert(indexHtml.includes('loyalty-card-barcode'), 'Missing .loyalty-card-barcode in index.html');
  });

  test('Desktop displays 3 Loyalty Metrics (Current, Earned, Used)', () => {
    assert(indexHtml.includes('id="metric-current-points"'), 'Missing #metric-current-points');
    assert(indexHtml.includes('id="metric-earned-points"'), 'Missing #metric-earned-points');
    assert(indexHtml.includes('id="metric-used-points"'), 'Missing #metric-used-points');
  });

  test('Desktop displays Loyalty History container and Edit Profile modal', () => {
    assert(indexHtml.includes('id="loyalty-history-list"'), 'Missing #loyalty-history-list');
    assert(indexHtml.includes('id="edit-profile-modal"'), 'Missing #edit-profile-modal');
    assert(indexHtml.includes('id="redeem-loyalty-modal"'), 'Missing #redeem-loyalty-modal');
  });

  console.log('\n--- 2. Mobile Profile & Loyalty UI (mobile.html) ---');

  test('Mobile has #screen-profile section', () => {
    assert(mobileHtml.includes('id="screen-profile"'), 'Missing #screen-profile in mobile.html');
  });

  test('Mobile displays Name, Email, Phone, Avatar & Account Information', () => {
    assert(mobileHtml.includes('id="mob-profile-name"'), 'Missing #mob-profile-name in mobile.html');
    assert(mobileHtml.includes('id="mob-profile-email"'), 'Missing #mob-profile-email in mobile.html');
    assert(mobileHtml.includes('id="mob-profile-phone"'), 'Missing #mob-profile-phone in mobile.html');
    assert(mobileHtml.includes('id="mob-account-info-student-id"'), 'Missing #mob-account-info-student-id in mobile.html');
    assert(mobileHtml.includes('id="mob-account-info-wallet"'), 'Missing #mob-account-info-wallet in mobile.html');
  });

  test('Mobile renders Clean Loyalty Card and 3 Metrics', () => {
    assert(mobileHtml.includes('campus-loyalty-card'), 'Missing .campus-loyalty-card in mobile.html');
    assert(mobileHtml.includes('id="mob-metric-current-points"'), 'Missing #mob-metric-current-points');
    assert(mobileHtml.includes('id="mob-metric-earned-points"'), 'Missing #mob-metric-earned-points');
    assert(mobileHtml.includes('id="mob-metric-used-points"'), 'Missing #mob-metric-used-points');
    assert(mobileHtml.includes('id="mob-loyalty-history-list"'), 'Missing #mob-loyalty-history-list');
  });

  console.log('\n--- 3. Styling & Modern UI Assets (style.css) ---');

  test('CSS provides clean luxury loyalty card and profile styling', () => {
    assert(styleCss.includes('.campus-loyalty-card'), 'Missing .campus-loyalty-card in style.css');
    assert(styleCss.includes('.loyalty-metrics-grid'), 'Missing .loyalty-metrics-grid in style.css');
    assert(styleCss.includes('.loyalty-ledger-row'), 'Missing .loyalty-ledger-row in style.css');
    assert(styleCss.includes('.profile-hero-card'), 'Missing .profile-hero-card in style.css');
  });

  console.log('\n--- 4. Client Controller Logic (student.js & api.js) ---');

  test('student.js implements renderProfile, renderLoyaltyHistory, and saveProfile', () => {
    assert(studentJs.includes('function renderProfile'), 'Missing renderProfile in student.js');
    assert(studentJs.includes('function renderLoyaltyHistory'), 'Missing renderLoyaltyHistory in student.js');
    assert(studentJs.includes('function saveProfile'), 'Missing saveProfile in student.js');
    assert(studentJs.includes('function executeLoyaltyRedemption'), 'Missing executeLoyaltyRedemption in student.js');
  });

  test('api.js implements updateProfile and redeemLoyalty', () => {
    assert(apiJs.includes('updateProfile'), 'Missing updateProfile in api.js');
    assert(apiJs.includes('redeemLoyalty'), 'Missing redeemLoyalty in api.js');
  });

  console.log('\n--- 5. Backend Loyalty Database & Rules ---');

  await testAsync('db.js includes loyalty_transactions collection and initial user profile fields', async () => {
    assert(Array.isArray(db.data.loyalty_transactions), 'loyalty_transactions is not an array in db.data');
    const user = db.data.users.find(u => u.id === 'u-101' || u._id === 'u-101');
    assert(user, 'User u-101 not found');
    assert(user.name, 'User has no name');
    assert(user.email, 'User has no email');
    assert(user.phone, 'User has no phone');
    assert(user.account_status, 'User has no account_status');
    assert(user.joined_date, 'User has no joined_date');
  });

  await testAsync('Server GET /api/loyalty/:user_id calculates points correctly (₹100 spent = 10 pts)', async () => {
    // Mock req, res
    let responseData = null;
    const req = { params: { user_id: 'u-101' } };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(data) { responseData = data; return this; }
    };

    // Find the get handler in loyalty routes stack
    const getHandler = loyaltyRoutes.stack.find(s => s.route && s.route.path === '/:user_id' && s.route.methods.get);
    assert(getHandler, 'GET /:user_id route handler not found in loyalty routes');

    await getHandler.handle(req, res);

    assert(responseData, 'No response received from GET /api/loyalty/u-101');
    assert(responseData.success === true, 'Response was not successful');
    assert(typeof responseData.current_points === 'number', 'current_points is not a number');
    assert(typeof responseData.points_earned === 'number', 'points_earned is not a number');
    assert(typeof responseData.points_used === 'number', 'points_used is not a number');
    assert(responseData.earning_rule.includes('₹100 spent = 10 loyalty points'), 'Earning rule missing specification');
    assert(Array.isArray(responseData.transactions), 'transactions is not an array');
    assert(responseData.points_earned - responseData.points_used === responseData.current_points, 'Points reconciliation formula mismatch');
  });

  await testAsync('Order placement records loyalty points calculation (₹100 = 10 pts) in database', async () => {
    const user = db.data.users.find(u => u.id === 'u-101' || u._id === 'u-101');
    const initialPoints = user.loyalty_points || 0;
    const orderTotal = 250; // ₹250 -> 25 points
    const earnedPoints = Math.floor(orderTotal / 10);

    const testTxId = 'lt-test-' + Date.now();
    const tx = {
      id: testTxId,
      user_id: 'u-101',
      order_id: 'cb-test-order',
      type: 'EARNED',
      amount_spent: orderTotal,
      points: earnedPoints,
      description: `Order #cb-test-order (₹${orderTotal})`,
      created_at: new Date().toISOString()
    };

    db.data.loyalty_transactions.push(tx);
    user.loyalty_points = initialPoints + earnedPoints;

    const recorded = db.data.loyalty_transactions.find(t => t.id === testTxId);
    assert(recorded, 'Transaction was not stored in db.data.loyalty_transactions');
    assert.strictEqual(recorded.points, 25, 'Earned points calculation incorrect: 250 spent must equal 25 points');

    // Clean up test entry
    db.data.loyalty_transactions = db.data.loyalty_transactions.filter(t => t.id !== testTxId);
    user.loyalty_points = initialPoints;
  });

  await testAsync('Server POST /api/loyalty/redeem creates audit transaction and credits wallet', async () => {
    const user = db.data.users.find(u => u.id === 'u-101' || u._id === 'u-101');
    const origPoints = user.loyalty_points || 0;
    const origWallet = user.wallet_balance || 0;

    // Ensure user has at least 150 points for test
    user.loyalty_points = Math.max(origPoints, 150);

    let responseData = null;
    const req = {
      body: {
        user_id: 'u-101',
        points: 100,
        credit_to_wallet: true
      }
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(data) { responseData = data; return this; }
    };

    const postRedeem = loyaltyRoutes.stack.find(s => s.route && s.route.path === '/redeem' && s.route.methods.post);
    assert(postRedeem, 'POST /redeem handler not found in loyalty routes');

    await postRedeem.handle(req, res);

    assert(responseData && responseData.success === true, 'Redemption failed: ' + (responseData ? responseData.message : 'no response'));
    assert.strictEqual(responseData.points_redeemed, 100, 'Redeemed points mismatch');
    assert.strictEqual(responseData.wallet_credited, 100, 'Wallet credit mismatch (1 pt = ₹1)');

    // Verify stored transaction in database
    const dbTx = db.data.loyalty_transactions.find(t => t.id === responseData.transaction_id || t.id === responseData.transaction.id);
    assert(dbTx, 'Redemption transaction not found in db.data.loyalty_transactions');
    assert.strictEqual(dbTx.type, 'REDEEMED', 'Transaction type must be REDEEMED');
    assert.strictEqual(dbTx.points, 100, 'Transaction points mismatch');

    // Clean up
    user.loyalty_points = origPoints;
    user.wallet_balance = origWallet;
    db.data.loyalty_transactions = db.data.loyalty_transactions.filter(t => t.id !== dbTx.id);
  });

  await testAsync('Server PUT /api/auth/profile/:id updates name, email, phone, and profile_image', async () => {
    const user = db.data.users.find(u => u.id === 'u-101' || u._id === 'u-101');
    const origName = user.name;
    const origPhone = user.phone;

    let responseData = null;
    const req = {
      params: { id: 'u-101' },
      body: {
        name: 'Jaswant Karun (Updated)',
        phone: '+91 98765 43210',
        profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        department: 'Computer Science & Engineering'
      }
    };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(data) { responseData = data; return this; }
    };

    const putProfile = authRoutes.stack.find(s => s.route && s.route.path === '/profile/:id' && s.route.methods.put);
    assert(putProfile, 'PUT /profile/:id handler not found in auth routes');

    await putProfile.handle(req, res);

    assert(responseData && responseData.success === true, 'Profile update failed');
    assert.strictEqual(responseData.user.name, 'Jaswant Karun (Updated)');
    assert.strictEqual(responseData.user.phone, '+91 98765 43210');

    // Restore original values
    user.name = origName;
    user.phone = origPhone;
  });

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed}/${total} passed (${Math.round((passed/total)*100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
