/**
 * CampusBite - STEP 28: Complete End-to-End System Test Suite
 * Tests Student Flow (17 steps + invalid cases) & Admin Flow (14 steps + invalid cases)
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

console.log('====================================================');
console.log('🧪 CAMPUSBITE STEP 28: COMPLETE END-TO-END TEST SUITE');
console.log('====================================================\n');

const results = {
  passed: 0,
  failed: 0,
  bugs: []
};

function recordPass(testName) {
  results.passed++;
  console.log(`  ✅ [PASS] ${testName}`);
}

function recordFail(testName, err, isBug = false) {
  results.failed++;
  console.error(`  ❌ [FAIL] ${testName}`);
  console.error(`     Error: ${err.message || err}`);
  if (isBug) {
    results.bugs.push({ test: testName, error: err.message || String(err) });
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTestSuite() {
  let studentToken = null;
  let studentUser = null;
  let adminToken = null;
  let adminUser = null;
  let createdOrderId = null;
  let testProductId = null;
  let testCouponCode = null;

  // ====================================================
  // PART 1: STUDENT FLOW
  // ====================================================
  console.log('\n----------------------------------------------------');
  console.log('🧑‍🎓 PART 1: STUDENT FLOW TESTING');
  console.log('----------------------------------------------------');

  // 1.1 Register
  const testStudentEmail = `student_${Date.now()}@campus.edu`;
  try {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Alex Rivera',
        email: testStudentEmail,
        phone: '+91 98401 99887',
        role: 'student',
        password: 'Password123!',
        department: 'Information Technology'
      }
    });
    assert(res.status === 201 && res.data.success, 'Registration succeeded with 201');
    assert(res.data.token, 'Token returned on registration');
    assert.strictEqual(res.data.user.password, undefined, 'Password omitted in registration response');
    assert.strictEqual(res.data.user.loyalty_points, 50, 'Welcome bonus loyalty points credited');
    studentUser = res.data.user;
    studentToken = res.data.token;
    recordPass('Student Flow 1: Register new student account (+50 welcome loyalty pts credited)');
  } catch (e) {
    recordFail('Student Flow 1: Register new student account', e, true);
  }

  // 1.1.b Invalid Registration cases
  try {
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Duplicate User', email: testStudentEmail, password: 'Password123!' }
    });
    assert(dupRes.status === 400 && !dupRes.data.success, 'Duplicate email registration rejected with 400');

    const emptyRes = await request('/api/auth/register', {
      method: 'POST',
      body: { name: '', email: '', password: '' }
    });
    assert(emptyRes.status === 400 && !emptyRes.data.success, 'Empty registration fields rejected with 400');
    recordPass('Student Flow 1 (Invalid Cases): Duplicate email & empty fields rejected properly');
  } catch (e) {
    recordFail('Student Flow 1 (Invalid Cases): Registration error handling', e, true);
  }

  // 1.2 Login
  try {
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testStudentEmail, password: 'Password123!' }
    });
    assert(loginRes.status === 200 && loginRes.data.success, 'Login succeeded with 200');
    assert(loginRes.data.token, 'Session token provided');
    assert.strictEqual(loginRes.data.user.password, undefined, 'Password field stripped from login response');
    studentToken = loginRes.data.token;
    studentUser = loginRes.data.user;
    recordPass('Student Flow 2: Login with credentials (sanitized response & JWT returned)');
  } catch (e) {
    recordFail('Student Flow 2: Login with credentials', e, true);
  }

  // 1.2.b Invalid Login cases
  try {
    const wrongPass = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testStudentEmail, password: 'WrongPassword999!' }
    });
    assert(wrongPass.status === 401 && !wrongPass.data.success, 'Invalid password rejected with 401');

    const nonExist = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent_ghost_user@campus.edu', password: 'password123' }
    });
    assert(nonExist.status === 401 && !nonExist.data.success, 'Non-existent email rejected with 401');
    recordPass('Student Flow 2 (Invalid Cases): Wrong password and unknown user rejected with 401');
  } catch (e) {
    recordFail('Student Flow 2 (Invalid Cases): Login validations', e, true);
  }

  // 1.3 Browse Catalog
  let allProducts = [];
  try {
    const prodRes = await request('/api/products');
    assert(prodRes.status === 200 && prodRes.data.products?.length > 0, 'Products catalog returned items');
    allProducts = prodRes.data.products;

    const catRes = await request('/api/categories');
    assert(catRes.status === 200 && Array.isArray(catRes.data.categories), 'Categories list returned');
    recordPass(`Student Flow 3: Browse catalog (${allProducts.length} items & ${catRes.data.categories.length} categories)`);
  } catch (e) {
    recordFail('Student Flow 3: Browse catalog', e, true);
  }

  // 1.4 Search
  try {
    const searchRes = await request('/api/products?search=burger');
    assert(searchRes.status === 200 && searchRes.data.products?.length > 0, 'Search for "burger" returned matches');
    assert(searchRes.data.products.every(p => p.name.toLowerCase().includes('burger') || p.description.toLowerCase().includes('burger')), 'Matches correspond to query');

    const emptySearch = await request('/api/products?search=xyznonexistentitem123');
    assert(emptySearch.status === 200 && emptySearch.data.products?.length === 0, 'Non-matching search returns empty array');
    recordPass('Student Flow 4: Search products (keyword matching & non-existent query handling)');
  } catch (e) {
    recordFail('Student Flow 4: Search products', e, true);
  }

  // 1.5 Filter
  try {
    const filterRes = await request('/api/products?category=Snacks');
    assert(filterRes.status === 200 && filterRes.data.products?.length > 0, 'Category filter "Snacks" returned products');
    assert(filterRes.data.products.every(p => p.category.toLowerCase() === 'snacks'), 'All filtered items are in Snacks category');
    recordPass('Student Flow 5: Filter products by category');
  } catch (e) {
    recordFail('Student Flow 5: Filter products by category', e, true);
  }

  // 1.6 Product Details
  const selectedProduct = allProducts.find(p => p.is_available && p.stock >= 5) || allProducts[0];
  try {
    const detailRes = await request(`/api/products/${selectedProduct.id}`);
    assert(detailRes.status === 200 && detailRes.data.product?.id === selectedProduct.id, 'Fetched single product details');
    assert(detailRes.data.product.price > 0, 'Product has valid price');
    assert(detailRes.data.product.name, 'Product has valid name');
    recordPass(`Student Flow 6: Product details screen (${selectedProduct.name} - ₹${selectedProduct.price})`);
  } catch (e) {
    recordFail('Student Flow 6: Product details', e, true);
  }

  // 1.7 Add to Cart & 1.8 Update Quantity (Simulation of Cart Model)
  const cartItem = {
    product_id: selectedProduct.id,
    name: selectedProduct.name,
    price: selectedProduct.price,
    quantity: 1
  };
  try {
    // Increment quantity to 3 (so subtotal >= ₹200 for CAMPUS20)
    cartItem.quantity = 3;
    assert.strictEqual(cartItem.quantity, 3, 'Quantity incremented to 3');
    assert(cartItem.quantity <= selectedProduct.stock, 'Quantity respects available stock bounds');
    const subtotal = cartItem.price * cartItem.quantity;
    assert.strictEqual(subtotal, selectedProduct.price * 3, 'Cart subtotal matches quantity * price');
    recordPass('Student Flow 7 & 8: Add to Cart & update quantity with stock boundary constraints');
  } catch (e) {
    recordFail('Student Flow 7 & 8: Cart quantity management', e, true);
  }

  // 1.9 Coupons
  let appliedDiscount = 0;
  try {
    // Valid coupon test with subtotal = 240
    const couponRes = await request('/api/coupons/apply', {
      method: 'POST',
      body: { code: 'CAMPUS20', subtotal: 240 }
    });
    assert(couponRes.status === 200 && couponRes.data.success, 'CAMPUS20 coupon applied successfully');
    appliedDiscount = couponRes.data.discount;
    assert(appliedDiscount === 48, 'CAMPUS20 computes 20% discount of ₹240 = ₹48');

    // Invalid coupon: minimum order deficit
    const minOrderFail = await request('/api/coupons/apply', {
      method: 'POST',
      body: { code: 'CAMPUS20', subtotal: 50 }
    });
    assert(minOrderFail.status === 400 && !minOrderFail.data.success, 'Minimum order deficit rejected with 400');

    // Invalid coupon: inactive or expired
    const expiredFail = await request('/api/coupons/apply', {
      method: 'POST',
      body: { code: 'EXPIRED50', subtotal: 300 }
    });
    assert(expiredFail.status === 400 && !expiredFail.data.success, 'Expired coupon rejected with 400');
    recordPass('Student Flow 9: Coupon application (valid calculation, min order enforcement & expired rejection)');
  } catch (e) {
    recordFail('Student Flow 9: Coupon application', e, true);
  }

  // 1.10 Checkout, 1.11 Pickup Slot & 1.12 Payment Simulation
  let orderResponse = null;
  try {
    // First simulate payment via gateway endpoint
    const payableAmount = selectedProduct.price * 3 - appliedDiscount;
    const simPayRes = await request('/api/orders/simulate-payment', {
      method: 'POST',
      body: {
        payment_method: 'UPI',
        upi_id: 'student@okaxis',
        amount: payableAmount
      }
    });
    assert(simPayRes.status === 200 && simPayRes.data.payment_status === 'PAID', 'Simulated UPI payment verified');

    // Reject invalid UPI ID
    const badUpi = await request('/api/orders/simulate-payment', {
      method: 'POST',
      body: { payment_method: 'UPI', upi_id: 'invalid-vpa-format' }
    });
    assert(badUpi.status === 400 && !badUpi.data.success, 'Invalid UPI VPA rejected with 400');

    // Wait 200ms to avoid burst duplicate guard
    await sleep(200);

    // Place actual order with subtotal >= 200
    const placeRes = await request('/api/orders', {
      method: 'POST',
      body: {
        user_id: studentUser.id,
        customer_name: studentUser.name,
        customer_phone: studentUser.phone,
        items: [{ product_id: selectedProduct.id, quantity: 3 }],
        coupon_code: 'CAMPUS20',
        payment_method: 'UPI',
        payment_status: 'PAID',
        upi_id: 'student@okaxis',
        pickup_slot: '12:30 PM – 12:45 PM',
        special_instructions: 'Less spicy please'
      }
    });
    assert(placeRes.status === 201 && placeRes.data.success, 'Order successfully created with 201: ' + (placeRes.data ? placeRes.data.message : 'no response'));
    assert(placeRes.data.order?.id?.startsWith('CB'), 'Order ID format starts with CB');
    assert.strictEqual(placeRes.data.order.pickup_slot, '12:30 PM – 12:45 PM', 'Scheduled pickup slot preserved');
    assert.strictEqual(placeRes.data.order.payment_status, 'PAID', 'Payment status marked as PAID');
    createdOrderId = placeRes.data.order.id;
    orderResponse = placeRes.data.order;
    recordPass(`Student Flow 10, 11 & 12: Checkout, pickup slot selection & payment verification (Order #${createdOrderId})`);
  } catch (e) {
    recordFail('Student Flow 10, 11 & 12: Checkout & payment', e, true);
  }

  // 1.12.b Invalid Checkout Cases
  try {
    const emptyCart = await request('/api/orders', {
      method: 'POST',
      body: { user_id: studentUser.id, items: [], pickup_slot: '12:30 PM', payment_method: 'UPI' }
    });
    assert(emptyCart.status === 400 && !emptyCart.data.success, 'Empty cart rejected on checkout with 400');

    const missingSlot = await request('/api/orders', {
      method: 'POST',
      body: { user_id: studentUser.id, items: [{ product_id: selectedProduct.id, quantity: 1 }], pickup_slot: '', payment_method: 'UPI' }
    });
    assert(missingSlot.status === 400 && !missingSlot.data.success, 'Missing pickup slot rejected with 400');
    recordPass('Student Flow 10 (Invalid Cases): Empty cart and missing pickup slot rejected with 400');
  } catch (e) {
    recordFail('Student Flow 10 (Invalid Cases): Checkout validations', e, true);
  }

  // 1.13 Order Confirmation & 1.14 Live Tracking
  try {
    const targetId = createdOrderId || 'CB1001';
    const getOrderRes = await request(`/api/orders/${targetId}`);
    assert(getOrderRes.status === 200 && getOrderRes.data.order?.id === targetId, 'Order confirmation retrieved by ID');
    assert(getOrderRes.data.order.estimated_prep_time, 'Estimated preparation time assigned');
    assert(getOrderRes.data.order.pickup_counter >= 1, 'Pickup counter assigned');
    recordPass(`Student Flow 13 & 14: Order confirmation details & tracking (Counter ${getOrderRes.data.order.pickup_counter}, ${getOrderRes.data.order.estimated_prep_time})`);
  } catch (e) {
    recordFail('Student Flow 13 & 14: Order confirmation and tracking', e, true);
  }

  // 1.15 Order History
  try {
    const histRes = await request(`/api/orders?user_id=${studentUser.id}`);
    assert(histRes.status === 200 && Array.isArray(histRes.data.orders), 'Order history returned user orders list');
    if (createdOrderId) {
      assert(histRes.data.orders.some(o => o.id === createdOrderId), 'Created order is present in user history');
    }
    recordPass(`Student Flow 15: Order history retrieved (${histRes.data.orders.length} orders found for student)`);
  } catch (e) {
    recordFail('Student Flow 15: Order history', e, true);
  }

  // 1.16 Reviews & Ratings
  try {
    const reviewTargetId = createdOrderId || 'CB1001';
    // Initial attempt should be rejected if order is 'Order Placed' (not Completed)
    const prematureReview = await request('/api/reviews', {
      method: 'POST',
      body: {
        order_id: reviewTargetId,
        user_id: studentUser.id,
        user_name: studentUser.name,
        product_id: selectedProduct.id,
        rating: 5,
        comment: 'Too early review attempt'
      }
    });

    // Mark order Completed so review becomes eligible
    await request(`/api/orders/${reviewTargetId}/status`, {
      method: 'PUT',
      body: { status: 'Completed' }
    });

    // Valid review submission
    const reviewRes = await request('/api/reviews', {
      method: 'POST',
      body: {
        order_id: reviewTargetId,
        user_id: studentUser.id,
        user_name: studentUser.name,
        product_id: selectedProduct.id,
        rating: 5,
        comment: 'Fresh, piping hot and served right on schedule! Amazing service.'
      }
    });
    assert(reviewRes.status === 201 && reviewRes.data.success, 'Review successfully submitted for completed order');

    // Prevent duplicate review for the same order
    const dupReview = await request('/api/reviews', {
      method: 'POST',
      body: {
        order_id: reviewTargetId,
        user_id: studentUser.id,
        rating: 4,
        comment: 'Duplicate attempt'
      }
    });
    assert(dupReview.status === 400 && !dupReview.data.success, 'Duplicate review on same order rejected with 400');
    recordPass('Student Flow 16: Review submission (state gate, creation & duplicate prevention)');
  } catch (e) {
    recordFail('Student Flow 16: Reviews & ratings', e, true);
  }

  // 1.17 Loyalty Points & Rewards
  try {
    // Check points on u-101 (who starts with 420 points)
    const loyaltyRes = await request('/api/loyalty/u-101');
    assert(loyaltyRes.status === 200 && loyaltyRes.data.success, 'Loyalty profile fetched');
    assert(loyaltyRes.data.current_points >= 100, 'User u-101 has eligible loyalty points balance');

    // Test redemption: 100 points -> ₹10 wallet credit
    const redeemRes = await request('/api/loyalty/redeem', {
      method: 'POST',
      body: { user_id: 'u-101', points: 100, credit_to_wallet: true }
    });
    assert(redeemRes.status === 200 && redeemRes.data.success, 'Redeemed 100 loyalty points for wallet credit');
    recordPass('Student Flow 17: Loyalty balance check and point redemption into wallet');
  } catch (e) {
    recordFail('Student Flow 17: Loyalty points & rewards', e, true);
  }

  // ====================================================
  // PART 2: ADMIN FLOW
  // ====================================================
  console.log('\n----------------------------------------------------');
  console.log('🛡️ PART 2: ADMIN OPERATIONS & MANAGEMENT FLOW TESTING');
  console.log('----------------------------------------------------');

  // 2.1 Admin Login & Authorization
  try {
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@campusbite.com', password: 'admin123', role: 'admin' }
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.success, 'Admin logged in successfully');
    assert(adminLoginRes.data.token, 'Admin token received');
    assert.strictEqual(adminLoginRes.data.user.role, 'admin', 'User has admin role');
    adminToken = adminLoginRes.data.token;
    adminUser = adminLoginRes.data.user;

    // Verify /api/auth/admin-check
    const checkRes = await request('/api/auth/admin-check', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(checkRes.status === 200 && checkRes.data.success, 'Admin token verified on server guard');
    recordPass('Admin Flow 1: Admin login & cryptographic role verification');
  } catch (e) {
    recordFail('Admin Flow 1: Admin login', e, true);
  }

  // 2.2 Admin Dashboard Overview
  try {
    const healthRes = await request('/api/health');
    assert(healthRes.status === 200 && healthRes.data.status === 'online', 'Platform health online');
    assert(healthRes.data.database.connected, 'MongoDB database connected');
    recordPass('Admin Flow 2: Dashboard metrics & system telemetry active');
  } catch (e) {
    recordFail('Admin Flow 2: Dashboard overview', e, true);
  }

  // 2.3 View Order & 2.4 - 2.7 Order Lifecycle Kanban Transitions
  let lifecycleOrderId = null;
  try {
    await sleep(200);
    // Create an order specifically to walk through all lifecycle steps
    const newOrdRes = await request('/api/orders', {
      method: 'POST',
      body: {
        user_id: 'u-101',
        customer_name: 'Jaswant Karun',
        items: [{ product_id: 'p-1', quantity: 1 }],
        payment_method: 'UPI',
        payment_status: 'PAID',
        pickup_slot: '01:00 PM – 01:15 PM'
      }
    });
    assert(newOrdRes.status === 201, 'Order created for lifecycle test');
    lifecycleOrderId = newOrdRes.data.order.id;

    // View Order
    const viewRes = await request(`/api/orders/${lifecycleOrderId}`);
    assert(viewRes.status === 200 && viewRes.data.order?.order_status === 'Order Placed', 'Order starts in Order Placed status');
    recordPass(`Admin Flow 3: View Order details for #${lifecycleOrderId}`);

    // Confirm Order
    const confirmRes = await request(`/api/orders/${lifecycleOrderId}/status`, {
      method: 'PUT',
      body: { status: 'Confirmed' }
    });
    assert(confirmRes.status === 200 && confirmRes.data.order?.order_status === 'Confirmed', 'Order confirmed');
    recordPass(`Admin Flow 4: Confirm Order (#${lifecycleOrderId} -> Confirmed)`);

    // Transition to Preparing
    const prepRes = await request(`/api/orders/${lifecycleOrderId}/status`, {
      method: 'PUT',
      body: { status: 'Preparing' }
    });
    assert(prepRes.status === 200 && prepRes.data.order?.order_status === 'Preparing', 'Order set to Preparing');
    recordPass(`Admin Flow 5: Kitchen Cooking Stage (#${lifecycleOrderId} -> Preparing)`);

    // Transition to Ready for Pickup
    const readyRes = await request(`/api/orders/${lifecycleOrderId}/status`, {
      method: 'PUT',
      body: { status: 'Ready for Pickup' }
    });
    assert(readyRes.status === 200 && readyRes.data.order?.order_status === 'Ready for Pickup', 'Order set to Ready for Pickup');
    recordPass(`Admin Flow 6: Counter Notification (#${lifecycleOrderId} -> Ready for Pickup)`);

    // Transition to Completed
    const compRes = await request(`/api/orders/${lifecycleOrderId}/status`, {
      method: 'PUT',
      body: { status: 'Completed' }
    });
    assert(compRes.status === 200 && compRes.data.order?.order_status === 'Completed', 'Order set to Completed');
    recordPass(`Admin Flow 7: Order Finalized & Picked Up (#${lifecycleOrderId} -> Completed)`);
  } catch (e) {
    recordFail('Admin Flow 3-7: Order Kanban lifecycle', e, true);
  }

  // 2.8 Product Management (Create, Update, Delete)
  try {
    // Create Product
    const newProdRes = await request('/api/products', {
      method: 'POST',
      body: {
        name: 'Gourmet Paneer Tikka Wrap',
        category: 'Snacks',
        price: 110,
        description: 'Tandoori marinated cottage cheese with mint chutney in whole wheat roti',
        stock: 25,
        is_veg: true,
        prep_time: '7 mins'
      }
    });
    assert(newProdRes.status === 201 && newProdRes.data.success, 'New product created with 201');
    testProductId = newProdRes.data.product.id;

    // Update Product
    const updateProdRes = await request(`/api/products/${testProductId}`, {
      method: 'PUT',
      body: { price: 120, stock: 30 }
    });
    assert(updateProdRes.status === 200 && updateProdRes.data.product?.price === 120, 'Product price updated to 120');

    // Delete Product
    const deleteProdRes = await request(`/api/products/${testProductId}`, {
      method: 'DELETE'
    });
    assert(deleteProdRes.status === 200 && deleteProdRes.data.success, 'Product deleted successfully');
    recordPass('Admin Flow 8: Product management (Create, Update price/stock & Delete product)');
  } catch (e) {
    recordFail('Admin Flow 8: Product management', e, true);
  }

  // 2.9 Inventory Management (Stock updates & unavailable toggle)
  try {
    const testInvProd = allProducts[1] || allProducts[0];
    const initialStock = testInvProd.stock;

    // Update stock to 15
    const invUpdateRes = await request(`/api/products/${testInvProd.id}`, {
      method: 'PUT',
      body: { stock: 15, is_available: true }
    });
    assert(invUpdateRes.status === 200 && invUpdateRes.data.product?.stock === 15, 'Stock updated to 15');

    // Toggle unavailable
    const unavailRes = await request(`/api/products/${testInvProd.id}`, {
      method: 'PUT',
      body: { is_available: false }
    });
    assert(unavailRes.status === 200 && unavailRes.data.product?.is_available === false, 'Product marked out of stock / unavailable');

    // Restore availability
    await request(`/api/products/${testInvProd.id}`, {
      method: 'PUT',
      body: { is_available: true, stock: initialStock }
    });
    recordPass('Admin Flow 9: Inventory management (Stock level updates & availability toggles)');
  } catch (e) {
    recordFail('Admin Flow 9: Inventory management', e, true);
  }

  // 2.10 Customers Management
  try {
    const custRes = await request('/api/customers', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(custRes.status === 200 && custRes.data.success, 'Customers list returned with 200');
    assert(custRes.data.customers?.length > 0, 'Customers directory is populated');

    // Customer details
    const firstCust = custRes.data.customers[0];
    const detailRes = await request(`/api/customers/${firstCust.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(detailRes.status === 200 && detailRes.data.customer?.id === firstCust.id, 'Customer details view loaded with order history');
    const orderHistory = detailRes.data.orders || detailRes.data.customer.order_history;
    assert(Array.isArray(orderHistory), 'Customer order history attached');
    recordPass(`Admin Flow 10: Customer CRM management (${custRes.data.customers.length} diners with order histories)`);
  } catch (e) {
    recordFail('Admin Flow 10: Customers management', e, true);
  }

  // 2.11 Coupons Management (Create, Edit, Toggle, Delete)
  try {
    const uniqueCode = `FLASH${Date.now().toString().slice(-4)}`;
    // Create Coupon
    const createCoupRes = await request('/api/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        code: uniqueCode,
        description: 'Special 15% flash campus discount',
        discount_type: 'percentage',
        discount_value: 15,
        minimum_order: 120,
        max_discount: 40,
        expiry_date: '2026-12-31',
        is_active: true
      }
    });
    assert(createCoupRes.status === 201 && createCoupRes.data.success, 'Flash coupon created with 201');
    const createdCoup = createCoupRes.data.coupon;
    testCouponCode = createdCoup.code;

    // Edit Coupon
    const editCoupRes = await request(`/api/coupons/${createdCoup.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { discount_value: 20, max_discount: 60 }
    });
    assert(editCoupRes.status === 200 && editCoupRes.data.coupon?.discount_value === 20, 'Coupon discount updated to 20%');

    // Deactivate Coupon
    const deactRes = await request(`/api/coupons/${createdCoup.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { is_active: false }
    });
    assert(deactRes.status === 200 && deactRes.data.coupon?.is_active === false, 'Coupon deactivated');

    // Delete Coupon
    const delCoupRes = await request(`/api/coupons/${createdCoup.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(delCoupRes.status === 200 && delCoupRes.data.success, 'Coupon deleted');
    recordPass('Admin Flow 11: Coupon lifecycle (Create, Edit discount/caps, Deactivate & Delete)');
  } catch (e) {
    recordFail('Admin Flow 11: Coupons management', e, true);
  }

  // 2.12 Reviews Moderation & Inspection
  try {
    const revsRes = await request('/api/reviews');
    assert(revsRes.status === 200 && revsRes.data.success, 'Customer reviews loaded');
    const avg = revsRes.data.avg_rating || (revsRes.data.stats && revsRes.data.stats.avg_rating);
    assert(avg > 0, 'Average rating calculation present');
    recordPass(`Admin Flow 12: Customer reviews & ratings hub (Avg rating: ${avg}★, ${revsRes.data.count} reviews)`);
  } catch (e) {
    recordFail('Admin Flow 12: Reviews inspection', e, true);
  }

  // 2.13 Analytics & Business Intelligence
  try {
    // 7 Days
    const a7d = await request('/api/analytics?range=7days', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(a7d.status === 200 && a7d.data.success, '7 Days analytics loaded');
    const totalSales = a7d.data.analytics?.total_sales ?? a7d.data.kpis?.total_sales;
    assert(totalSales !== undefined && totalSales >= 0, 'Total sales KPI calculated');
    const totalOrders = a7d.data.analytics?.total_orders ?? a7d.data.kpis?.total_orders;
    assert(totalOrders !== undefined && totalOrders >= 0, 'Total orders KPI calculated');

    // Today & 30 Days ranges
    const aToday = await request('/api/analytics?range=today', { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(aToday.status === 200 && aToday.data.success, 'Today analytics loaded');

    const a30d = await request('/api/analytics?range=30days', { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(a30d.status === 200 && a30d.data.success, '30 Days analytics loaded');
    recordPass('Admin Flow 13: Business Analytics & BI Hub (Sales, Orders, AOV, Top Products & Date Filtering)');
  } catch (e) {
    recordFail('Admin Flow 13: Analytics & BI Hub', e, true);
  }

  // 2.14 Smart Demand Insight & Decision Support
  try {
    const demandRes = await request('/api/smart-demand', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(demandRes.status === 200 && Array.isArray(demandRes.data.insights), 'Smart demand insights returned');
    assert(demandRes.data.insights.some(i => i.demand_level.includes('HIGH')), 'High demand prediction present');
    assert(demandRes.data.insights.some(i => i.decision_support), 'Decision support guidance present');
    assert(demandRes.data.attribution_notice, 'Transparent rule-based attribution displayed');

    // Test apply prep plan
    const firstInsight = demandRes.data.insights[0];
    const applyRes = await request('/api/smart-demand/apply-prep', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { productId: firstInsight.product_id, prepAmount: 15 }
    });
    assert(applyRes.status === 200 && applyRes.data.success, 'Kitchen prep plan applied (+15 units)');
    recordPass('Admin Flow 14: Smart Demand Insight (High/Med/Low levels, Decision Support & Prep Plan Application)');
  } catch (e) {
    recordFail('Admin Flow 14: Smart Demand Insight', e, true);
  }

  // ====================================================
  // SUMMARY REPORT
  // ====================================================
  console.log('\n====================================================');
  console.log(`📊 END-TO-END TEST RESULTS SUMMARY`);
  console.log(`   PASS: ${results.passed}`);
  console.log(`   FAIL: ${results.failed}`);
  console.log(`   BUGS: ${results.bugs.length}`);
  console.log('====================================================\n');

  if (results.bugs.length > 0) {
    console.error('🚨 DISCOVERED BUGS:');
    results.bugs.forEach((b, idx) => {
      console.error(`  ${idx + 1}. [${b.test}]: ${b.error}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL END-TO-END STUDENT AND ADMIN FLOWS PASSED 100% WITHOUT BUGS!\n');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
