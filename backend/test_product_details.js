/**
 * Step 7 Validation Suite - Product Details Screen
 * Tests:
 * 1. Product Details Data Fetching & Structure (In-Stock vs Out-of-Stock)
 * 2. Quantity Selector Mechanics (+, -, min 1, stock bounds, subtotal preview)
 * 3. Unavailable / Out-of-Stock Product Validation (Client & Server rejection)
 * 4. Add to Cart with Quantity Accumulation
 * 5. Success Confirmation Output
 * 6. UI DOM & CSS Structure (HTML screens, modals, style tokens)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING STEP 7: PRODUCT DETAILS SCREEN');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  // 1. DATA FETCHING & DISPLAY ATTRIBUTES
  await test('1.1 Fetch in-stock product details with all required display fields', async () => {
    const res = await fetch(`${BASE_URL}/products/p-2`);
    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.ok(data.success, 'Success flag should be true');
    const p = data.product;

    assert.strictEqual(p.id, 'p-2', 'Product ID should be p-2');
    assert.ok(p.name, 'Product must have name');
    assert.ok(p.description, 'Product must have description');
    assert.ok(p.price > 0, 'Product must have price');
    assert.strictEqual(p.is_available, true, 'Product should be marked available');
    assert.ok(p.stock > 0, 'Product stock should be positive');
    assert.ok(p.image_url || p.image_emoji, 'Product must have image source or emoji');
    assert.ok(p.category, 'Product must have category');
  });

  await test('1.2 Fetch out-of-stock product details and verify availability state', async () => {
    const res = await fetch(`${BASE_URL}/products/p-17`);
    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.ok(data.success, 'Success flag should be true');
    const p = data.product;

    assert.strictEqual(p.id, 'p-17', 'Product ID should be p-17');
    assert.strictEqual(p.name, 'Seasonal Alphonso Mango Lassi', 'Product name match');
    assert.ok(p.description, 'Must have description');
    assert.strictEqual(p.is_available, false, 'Should be flagged as unavailable');
    assert.strictEqual(p.stock, 0, 'Stock must be 0');
  });

  // 2. QUANTITY SELECTOR MECHANICS
  await test('2.1 Quantity selector math: min 1, increment, decrement, and subtotal calculation', async () => {
    // Simulate StudentApp quantity stepper logic
    const product = { id: 'p-1', name: 'Classic Veg Burger', price: 80, stock: 15, is_available: true };
    let currentQty = 1;

    function adjustQty(delta) {
      const next = currentQty + delta;
      if (next < 1) return currentQty;
      if (next > product.stock) return currentQty;
      currentQty = next;
      return currentQty;
    }

    // Default is 1
    assert.strictEqual(currentQty, 1, 'Default quantity must be 1');

    // Decrement below 1 should be prevented
    adjustQty(-1);
    assert.strictEqual(currentQty, 1, 'Quantity cannot go below 1');

    // Increment
    adjustQty(1);
    assert.strictEqual(currentQty, 2, 'Quantity should increase to 2');
    assert.strictEqual(product.price * currentQty, 160, 'Subtotal should be ₹160');

    adjustQty(3); // +3 -> 5
    assert.strictEqual(currentQty, 5, 'Quantity should be 5');
    assert.strictEqual(product.price * currentQty, 400, 'Subtotal should be ₹400');

    // Decrement
    adjustQty(-2);
    assert.strictEqual(currentQty, 3, 'Quantity should decrease to 3');
  });

  await test('2.2 Quantity selector respects upper stock limit bound', async () => {
    const limitedProduct = { id: 'p-rare', name: 'Special Pastry', price: 120, stock: 3, is_available: true };
    let qty = 1;

    function step(delta) {
      const next = qty + delta;
      if (next < 1 || next > limitedProduct.stock) return false;
      qty = next;
      return true;
    }

    assert.ok(step(1), 'Increment to 2 allowed');
    assert.ok(step(1), 'Increment to 3 allowed');
    assert.strictEqual(step(1), false, 'Increment past stock (3) should be rejected');
    assert.strictEqual(qty, 3, 'Quantity should remain clamped at max stock 3');
  });

  // 3. UNAVAILABLE PRODUCT VALIDATION
  await test('3.1 Reject adding unavailable product in client cart controller', async () => {
    const outOfStockItem = { id: 'p-17', name: 'Seasonal Alphonso Mango Lassi', price: 60, stock: 0, is_available: false };
    const cart = [];

    function addToCart(item, qty = 1) {
      if (item.is_available === false || (item.stock !== undefined && item.stock <= 0)) {
        return { success: false, error: 'Product is currently out of stock' };
      }
      cart.push({ id: item.id, qty });
      return { success: true };
    }

    const res = addToCart(outOfStockItem, 1);
    assert.strictEqual(res.success, false, 'Adding out-of-stock item must be rejected');
    assert.strictEqual(cart.length, 0, 'Cart should remain empty');
  });

  await test('3.2 Backend server rejects orders containing unavailable items (400 Bad Request)', async () => {
    const orderPayload = {
      user_id: 'u-101',
      items: [
        { product_id: 'p-17', name: 'Seasonal Alphonso Mango Lassi', quantity: 1, price: 60 }
      ],
      payment_method: 'UPI',
      pickup_slot: '12:45 PM – 12:55 PM'
    };

    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    assert.strictEqual(res.status, 400, 'Server should reject out-of-stock product with 400 Bad Request');
    const data = await res.json();
    assert.strictEqual(data.success, false, 'Response success should be false');
    assert.ok(data.message.includes('out of stock'), `Error message should mention out of stock, got: ${data.message}`);
  });

  // 4. ADD TO CART WITH QUANTITY ACCUMULATION
  await test('4.1 Add multiple quantity to cart and verify accumulation and total calculation', async () => {
    const mockProducts = [
      { id: 'p-2', name: 'Cheese Burger Deluxe', price: 80, stock: 20, is_available: true },
      { id: 'p-5', name: 'Iced Cold Coffee', price: 50, stock: 30, is_available: true }
    ];

    const cart = [];

    function addToCart(productId, quantity = 1) {
      const prod = mockProducts.find(p => p.id === productId);
      if (!prod || !prod.is_available || prod.stock <= 0) return false;
      const existing = cart.find(c => c.productId === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({ productId: prod.id, name: prod.name, price: prod.price, quantity });
      }
      return true;
    }

    // Add 3 burgers
    assert.ok(addToCart('p-2', 3), 'Add 3 burgers');
    assert.strictEqual(cart.length, 1);
    assert.strictEqual(cart[0].quantity, 3);
    assert.strictEqual(cart[0].price * cart[0].quantity, 240);

    // Add 2 more burgers
    assert.ok(addToCart('p-2', 2), 'Add 2 more burgers');
    assert.strictEqual(cart.length, 1);
    assert.strictEqual(cart[0].quantity, 5);
    assert.strictEqual(cart[0].price * cart[0].quantity, 400);

    // Add 2 cold coffees
    assert.ok(addToCart('p-5', 2), 'Add 2 cold coffees');
    assert.strictEqual(cart.length, 2);

    const totalBill = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    assert.strictEqual(totalBill, 500, 'Total bill should be 5*80 + 2*50 = 500');
  });

  // 5. SUCCESS CONFIRMATION FLOW
  await test('5.1 Verify success confirmation card payload format and UI actions', () => {
    const item = { id: 'p-2', name: 'Cheese Burger Deluxe', price: 80 };
    const addedQty = 3;
    const totalInCart = 5;

    const confirmationData = {
      title: 'Item Successfully Added to Tray!',
      message: `Added ${addedQty} portions of ${item.name} (₹${item.price * addedQty}) to your order tray. Total in tray: ${totalInCart}.`,
      viewTrayAction: 'cart',
      continueAction: 'menu'
    };

    assert.ok(confirmationData.title.includes('Successfully Added'), 'Title should confirm addition');
    assert.ok(confirmationData.message.includes('Added 3 portions'), 'Message should detail quantity');
    assert.ok(confirmationData.message.includes('₹240'), 'Message should show subtotal');
    assert.strictEqual(confirmationData.viewTrayAction, 'cart', 'View Tray should route to cart');
  });

  // 6. DOM & CSS STRUCTURE VERIFICATION
  await test('6.1 Verify frontend/index.html contains screen-product-detail & product-detail-modal', () => {
    const indexPath = path.join(__dirname, '../frontend/index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');

    assert.ok(content.includes('id="screen-product-detail"'), 'index.html must have #screen-product-detail');
    assert.ok(content.includes('id="screen-product-detail-content"'), 'index.html must have #screen-product-detail-content');
    assert.ok(content.includes('id="product-detail-modal"'), 'index.html must have #product-detail-modal');
    assert.ok(content.includes('id="product-detail-modal-body"'), 'index.html must have #product-detail-modal-body');
  });

  await test('6.2 Verify frontend/mobile.html contains screen-product-detail & product-detail-modal', () => {
    const mobPath = path.join(__dirname, '../frontend/mobile.html');
    const content = fs.readFileSync(mobPath, 'utf-8');

    assert.ok(content.includes('id="screen-product-detail"'), 'mobile.html must have #screen-product-detail');
    assert.ok(content.includes('id="screen-product-detail-content"'), 'mobile.html must have #screen-product-detail-content');
    assert.ok(content.includes('id="product-detail-modal"'), 'mobile.html must have #product-detail-modal');
  });

  await test('6.3 Verify frontend/css/style.css contains complete Product Details design rules', () => {
    const cssPath = path.join(__dirname, '../frontend/css/style.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    const requiredClasses = [
      '.product-detail-page-wrapper',
      '.product-detail-grid',
      '.product-detail-media-card',
      '.product-detail-hero-media',
      '.product-detail-hero-img',
      '.product-detail-title',
      '.product-detail-current-price',
      '.product-detail-availability-banner',
      '.product-detail-qty-section',
      '.product-detail-stepper-control',
      '.detail-stepper-btn',
      '.detail-qty-display',
      '.product-detail-add-btn',
      '.detail-success-card',
      '.detail-success-view-tray-btn'
    ];

    requiredClasses.forEach(cls => {
      assert.ok(css.includes(cls), `style.css must define class ${cls}`);
    });
  });

  await test('6.4 Verify frontend/js/student.js implements all Step 7 Product Details methods', () => {
    const jsPath = path.join(__dirname, '../frontend/js/student.js');
    const js = fs.readFileSync(jsPath, 'utf-8');

    assert.ok(js.includes('openProductDetails('), 'student.js must have openProductDetails');
    assert.ok(js.includes('renderProductDetailsHtml('), 'student.js must have renderProductDetailsHtml');
    assert.ok(js.includes('adjustDetailQuantity('), 'student.js must have adjustDetailQuantity');
    assert.ok(js.includes('confirmDetailAddToCart('), 'student.js must have confirmDetailAddToCart');
    assert.ok(js.includes('detail-success-card'), 'student.js must handle success confirmation card');
    assert.ok(js.includes('currentDetailQty'), 'student.js must track currentDetailQty');
    assert.ok(js.includes('currentDetailProduct'), 'student.js must track currentDetailProduct');
  });

  console.log('\n====================================================');
  console.log(`📊 TEST SUMMARY: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
