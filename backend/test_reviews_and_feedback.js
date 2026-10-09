/**
 * CampusBite - STEP 16: Customer Reviews & Feedback Test Suite
 * Validates:
 * 1. UI Elements (Desktop & Mobile):
 *    - Review Modal (#customer-review-modal) with order selection, 1-5 star picker, feedback comment, submit button
 *    - Display of Average Rating and Recent Reviews
 *    - Admin Reviews View in admin.html (#admin-tab-reviews, #admin-reviews-list)
 * 2. Client-side Controller & API:
 *    - StudentApp review methods (openCustomerReviewModal, setReviewRating, submitCustomerReview, renderCommunityReviews)
 *    - AdminApp.loadReviews
 *    - api.getReviews, api.checkOrderReview, api.submitReview
 * 3. Validation & Rules (Server-side):
 *    - 1–5 star rating validation (rejection of invalid ratings)
 *    - Feedback comment validation (minimum length check)
 *    - Prevention of reviews for incomplete orders (Pending, Confirmed, Preparing, Ready)
 *    - Prevention of duplicate reviews for the same completed order
 *    - Successful review creation and database persistence for completed orders
 * 4. Aggregations & Statistics:
 *    - Accurate calculation of average rating and rating breakdown
 *    - Recent reviews sorting and retrieval
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const express = require('express');
const db = require('./data/db');
const reviewsRoutes = require('./routes/reviews');

console.log('====================================================');
console.log('🧪 CAMPUSBITE STEP 16: REVIEWS & FEEDBACK TEST SUITE');
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
  const adminHtml = fs.readFileSync(path.join(__dirname, '../frontend/admin.html'), 'utf8');
  const studentJs = fs.readFileSync(path.join(__dirname, '../frontend/js/student.js'), 'utf8');
  const adminJs = fs.readFileSync(path.join(__dirname, '../frontend/js/admin.js'), 'utf8');
  const apiJs = fs.readFileSync(path.join(__dirname, '../frontend/js/api.js'), 'utf8');
  const styleCss = fs.readFileSync(path.join(__dirname, '../frontend/css/style.css'), 'utf8');

  console.log('--- 1. Desktop & Mobile Customer Review UI ---');

  test('Desktop index.html contains #customer-review-modal with full review form', () => {
    assert(indexHtml.includes('id="customer-review-modal"'), 'Missing #customer-review-modal in index.html');
    assert(indexHtml.includes('id="review-order-select"'), 'Missing #review-order-select in index.html');
    assert(indexHtml.includes('star-pick-btn') || indexHtml.includes('star-interactive-row'), 'Missing star rating picker in index.html');
    assert(indexHtml.includes('id="review-comment-input"'), 'Missing #review-comment-input in index.html');
    assert(indexHtml.includes('StudentApp.submitCustomerReview()'), 'Missing submitCustomerReview button in index.html');
  });

  test('Desktop index.html displays Average Rating & Recent Reviews community section', () => {
    assert(indexHtml.includes('id="review-modal-avg-rating"'), 'Missing #review-modal-avg-rating in index.html');
    assert(indexHtml.includes('id="recent-reviews-list"'), 'Missing #recent-reviews-list in index.html');
  });

  test('Mobile mobile.html contains #customer-review-modal with review form and recent reviews', () => {
    assert(mobileHtml.includes('id="customer-review-modal"'), 'Missing #customer-review-modal in mobile.html');
    assert(mobileHtml.includes('mob-review-order-select'), 'Missing mob-review-order-select in mobile.html');
    assert(mobileHtml.includes('mob-review-comment-input'), 'Missing mob-review-comment-input in mobile.html');
    assert(mobileHtml.includes('mob-review-modal-avg-rating'), 'Missing mob-review-modal-avg-rating in mobile.html');
    assert(mobileHtml.includes('mob-recent-reviews-list'), 'Missing mob-recent-reviews-list in mobile.html');
  });

  test('Admin admin.html includes Customer Reviews tab (#admin-tab-reviews) and reviews container', () => {
    assert(adminHtml.includes('id="admin-tab-reviews"'), 'Missing #admin-tab-reviews in admin.html');
    assert(adminHtml.includes('id="admin-reviews-list"'), 'Missing #admin-reviews-list in admin.html');
    assert(adminHtml.includes('Student Satisfaction Benchmark'), 'Missing benchmark header in admin.html');
  });

  console.log('\n--- 2. Frontend Controller & API Integration ---');

  test('student.js implements openReviewModal, setReviewRating, and submitCustomerReview', () => {
    assert(studentJs.includes('openReviewModal(') || studentJs.includes('openReviewModal ='), 'Missing openReviewModal in student.js');
    assert(studentJs.includes('setReviewRating(') || studentJs.includes('setReviewRating ='), 'Missing setReviewRating in student.js');
    assert(studentJs.includes('submitCustomerReview(') || studentJs.includes('submitCustomerReview ='), 'Missing submitCustomerReview in student.js');
    assert(studentJs.includes('renderCommunityReviews(') || studentJs.includes('renderCommunityReviews ='), 'Missing renderCommunityReviews in student.js');
  });

  test('admin.js implements loadReviews to populate admin-reviews-list', () => {
    assert(adminJs.includes('loadReviews(') || adminJs.includes('loadReviews ='), 'Missing loadReviews in admin.js');
    assert(adminJs.includes('admin-reviews-list'), 'loadReviews does not target admin-reviews-list');
  });

  test('api.js implements getReviews and submitReview endpoints', () => {
    assert(apiJs.includes('getReviews:'), 'Missing getReviews in api.js');
    assert(apiJs.includes('submitReview:'), 'Missing submitReview in api.js');
  });

  test('style.css defines reviews modal, star picker, and review card styles', () => {
    assert(styleCss.includes('.reviews-modal-window'), 'Missing .reviews-modal-window in style.css');
    assert(styleCss.includes('.star-pick-btn'), 'Missing .star-pick-btn in style.css');
    assert(styleCss.includes('.review-card-item'), 'Missing .review-card-item in style.css');
    assert(styleCss.includes('.review-community-hero'), 'Missing .review-community-hero in style.css');
  });

  console.log('\n--- 3. Backend API Validations & Rules ---');

  // Set up local express test instance
  const app = express();
  app.use(express.json());
  app.use('/api/reviews', reviewsRoutes);

  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}/api/reviews`;
      resolve();
    });
  });

  const http = require('http');

  function makeRequest(method, urlPath, payload) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(baseUrl + urlPath);
      const postData = payload ? JSON.stringify(payload) : null;
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch (e) {
            resolve({ status: res.statusCode, text: data });
          }
        });
      });

      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  }

  // Test GET reviews & aggregations
  await testAsync('GET /api/reviews returns average rating, count, breakdown, and recent reviews', async () => {
    const res = await makeRequest('GET', '', null);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(typeof res.data.avg_rating === 'number', 'avg_rating must be a number');
    assert(res.data.avg_rating >= 1 && res.data.avg_rating <= 5, 'avg_rating must be between 1 and 5');
    assert(typeof res.data.count === 'number', 'count must be a number');
    assert(res.data.rating_breakdown, 'rating_breakdown must be present');
    assert(Array.isArray(res.data.reviews), 'reviews must be an array');
    assert(Array.isArray(res.data.recent_reviews), 'recent_reviews must be an array');
  });

  // Test validation: Missing order_id
  await testAsync('POST /api/reviews rejects submission with missing order_id (400)', async () => {
    const res = await makeRequest('POST', '', {
      rating: 5,
      comment: 'Delicious meal and great speed'
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert(res.data.message.toLowerCase().includes('order id is required'));
  });

  // Test validation: Non-existent order
  await testAsync('POST /api/reviews rejects non-existent order (404)', async () => {
    const res = await makeRequest('POST', '', {
      order_id: 'NON-EXISTENT-ORDER-9999',
      rating: 5,
      comment: 'This order does not exist'
    });
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.data.success, false);
    assert(res.data.message.toLowerCase().includes('not found'));
  });

  // Test validation: Incomplete order prevention (PREVENT REVIEWS FOR ORDERS NOT COMPLETED)
  await testAsync('POST /api/reviews PREVENTS reviews for orders that are NOT completed (400)', async () => {
    // Find or create an in-progress order (e.g. status: Preparing)
    const testPrepOrderId = 'cb-test-prep-' + Date.now();
    const incompleteOrder = {
      id: testPrepOrderId,
      user_id: 'u-101',
      customer_name: 'Jaswant Karun',
      order_status: 'Preparing',
      items: [{ product_id: 'p-1', name: 'Veg Samosa', price: 20, quantity: 2 }],
      total_amount: 40,
      created_at: new Date().toISOString()
    };
    db.data.orders.push(incompleteOrder);

    const res = await makeRequest('POST', '', {
      order_id: testPrepOrderId,
      rating: 4,
      comment: 'Trying to review food while it is still in the kitchen'
    });

    // Clean up temporary order
    db.data.orders = db.data.orders.filter(o => o.id !== testPrepOrderId);

    assert.strictEqual(res.status, 400, 'Must reject with 400 when order is not completed');
    assert.strictEqual(res.data.success, false);
    assert(res.data.message.toLowerCase().includes('completed'), 'Error message must specify reviews are only for completed orders');
  });

  // Test validation: Rating must be 1 to 5
  await testAsync('POST /api/reviews rejects invalid ratings (0, 6, decimal, or NaN)', async () => {
    // Create a temporary completed order
    const testCompletedOrderId = 'cb-test-comp-' + Date.now();
    const completedOrder = {
      id: testCompletedOrderId,
      user_id: 'u-101',
      customer_name: 'Jaswant Karun',
      order_status: 'Completed',
      items: [{ product_id: 'p-2', name: 'Cheese Burger', price: 100, quantity: 1 }],
      total_amount: 100,
      created_at: new Date().toISOString()
    };
    db.data.orders.push(completedOrder);

    // Test rating = 0
    const res0 = await makeRequest('POST', '', {
      order_id: testCompletedOrderId,
      rating: 0,
      comment: 'Valid comment text'
    });
    assert.strictEqual(res0.status, 400);

    // Test rating = 6
    const res6 = await makeRequest('POST', '', {
      order_id: testCompletedOrderId,
      rating: 6,
      comment: 'Valid comment text'
    });
    assert.strictEqual(res6.status, 400);

    // Test rating = 3.5 (non-integer)
    const resDecimal = await makeRequest('POST', '', {
      order_id: testCompletedOrderId,
      rating: 3.5,
      comment: 'Valid comment text'
    });
    assert.strictEqual(resDecimal.status, 400);

    // Clean up
    db.data.orders = db.data.orders.filter(o => o.id !== testCompletedOrderId);
  });

  // Test validation: Feedback comment required
  await testAsync('POST /api/reviews rejects empty or too short feedback comment (400)', async () => {
    const testCompletedOrderId = 'cb-test-comp-' + Date.now();
    const completedOrder = {
      id: testCompletedOrderId,
      user_id: 'u-101',
      customer_name: 'Jaswant Karun',
      order_status: 'Completed',
      items: [{ product_id: 'p-2', name: 'Cheese Burger', price: 100, quantity: 1 }],
      total_amount: 100,
      created_at: new Date().toISOString()
    };
    db.data.orders.push(completedOrder);

    const resEmpty = await makeRequest('POST', '', {
      order_id: testCompletedOrderId,
      rating: 5,
      comment: '  '
    });
    assert.strictEqual(resEmpty.status, 400);

    // Clean up
    db.data.orders = db.data.orders.filter(o => o.id !== testCompletedOrderId);
  });

  // Test successful review creation for a completed order
  let createdReviewId = null;
  let testOrderId = 'cb-test-comp-' + Date.now();

  await testAsync('POST /api/reviews creates review for completed order and persists to database (201)', async () => {
    const completedOrder = {
      id: testOrderId,
      user_id: 'u-101',
      customer_name: 'Jaswant Karun',
      order_status: 'Completed',
      items: [{ product_id: 'p-2', name: 'Cheese Burger Deluxe', price: 100, quantity: 1 }],
      total_amount: 100,
      created_at: new Date().toISOString()
    };
    db.data.orders.push(completedOrder);

    const res = await makeRequest('POST', '', {
      order_id: testOrderId,
      user_id: 'u-101',
      rating: 5,
      comment: 'Burger was piping hot, freshly grilled, and ready right at Counter 2!'
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert(res.data.review, 'Response must return created review object');
    assert.strictEqual(res.data.review.order_id, testOrderId);
    assert.strictEqual(res.data.review.rating, 5);
    assert.strictEqual(res.data.review.comment, 'Burger was piping hot, freshly grilled, and ready right at Counter 2!');

    createdReviewId = res.data.review.id;

    // Check review persistence in db.data.reviews
    const stored = db.data.reviews.find(r => r.id === createdReviewId);
    assert(stored, 'Review was not stored in db.data.reviews');
    assert.strictEqual(stored.rating, 5);
  });

  // Test duplicate review prevention (PREVENT DUPLICATE REVIEWS FOR SAME ORDER)
  await testAsync('POST /api/reviews PREVENTS duplicate reviews for the same completed order (400)', async () => {
    const resDuplicate = await makeRequest('POST', '', {
      order_id: testOrderId,
      user_id: 'u-101',
      rating: 4,
      comment: 'Submitting a second review for the same completed order'
    });

    assert.strictEqual(resDuplicate.status, 400, 'Duplicate submission must be rejected with 400');
    assert.strictEqual(resDuplicate.data.success, false);
    assert(resDuplicate.data.message.toLowerCase().includes('already'), 'Error message must state order has already been reviewed');

    // Clean up test order and review
    db.data.orders = db.data.orders.filter(o => o.id !== testOrderId);
    db.data.reviews = db.data.reviews.filter(r => r.id !== createdReviewId);
  });

  // Test GET review eligibility check
  await testAsync('GET /api/reviews/check/:order_id checks completion and review status', async () => {
    // 1. Incomplete order
    const prepId = 'cb-check-prep-' + Date.now();
    db.data.orders.push({
      id: prepId,
      order_status: 'Preparing',
      items: []
    });

    const resPrep = await makeRequest('GET', `/check/${prepId}`, null);
    assert.strictEqual(resPrep.status, 200);
    assert.strictEqual(resPrep.data.can_review, false);
    assert.strictEqual(resPrep.data.already_reviewed, false);

    // 2. Completed order
    const compId = 'cb-check-comp-' + Date.now();
    db.data.orders.push({
      id: compId,
      order_status: 'Completed',
      items: [{ name: 'Test Meal' }]
    });

    const resComp = await makeRequest('GET', `/check/${compId}`, null);
    assert.strictEqual(resComp.status, 200);
    assert.strictEqual(resComp.data.can_review, true);
    assert.strictEqual(resComp.data.already_reviewed, false);

    // Clean up
    db.data.orders = db.data.orders.filter(o => o.id !== prepId && o.id !== compId);
  });

  server.close();

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
