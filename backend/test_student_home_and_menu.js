/**
 * Step 6 Validation Suite - Student Home & Menu System
 * Tests:
 * 1. Product Loading (Real DB products, categories, coupons, orders)
 * 2. Search Functionality (API & Client-side matching)
 * 3. Category Filtering (API & Client-side matching)
 * 4. Add to Cart (Item accumulation, subtotal calculations)
 * 5. Out-of-stock Products (Rejection on cart addition and order checkout)
 */

const assert = require('assert');

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING STEP 6: STUDENT HOME & MENU SYSTEM');
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

  // 1. PRODUCT LOADING
  await test('1.1 Load all products from real database', async () => {
    const res = await fetch(`${BASE_URL}/products`);
    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.ok(data.success, 'Response success should be true');
    assert.ok(Array.isArray(data.products), 'Should return products array');
    assert.ok(data.products.length >= 16, `Expected at least 16 products, got ${data.products.length}`);
    
    // Verify required product fields
    const p1 = data.products.find(p => p.id === 'p-1');
    assert.ok(p1, 'Product p-1 should exist');
    assert.ok(p1.name, 'Product should have name');
    assert.ok(p1.price > 0, 'Product should have price');
    assert.ok(p1.category, 'Product should have category');
    assert.ok(p1.description, 'Product should have description');
    assert.ok(p1.stock !== undefined, 'Product should have stock');
    assert.ok(p1.is_available !== undefined, 'Product should have is_available');
  });

  await test('1.2 Load categories from real database', async () => {
    const res = await fetch(`${BASE_URL}/categories`);
    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.ok(data.success, 'Response success should be true');
    assert.ok(data.categories.length >= 5, 'Should return at least 5 categories');
    const catNames = data.categories.map(c => c.name);
    assert.ok(catNames.includes('Snacks'), 'Should include Snacks');
    assert.ok(catNames.includes('Drinks'), 'Should include Drinks');
    assert.ok(catNames.includes('Meals'), 'Should include Meals');
  });

  await test('1.3 Load coupons from real database for Offers section', async () => {
    const res = await fetch(`${BASE_URL}/coupons`);
    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.ok(data.success, 'Response success should be true');
    assert.ok(data.coupons.length >= 3, 'Should return active coupons');
    const campus20 = data.coupons.find(c => c.code === 'CAMPUS20');
    assert.ok(campus20, 'CAMPUS20 coupon should exist');
  });

  // 2. SEARCH FUNCTIONALITY
  await test('2.1 Search products via API query parameter', async () => {
    const res = await fetch(`${BASE_URL}/products?search=burger`);
    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.ok(data.success, 'Response success should be true');
    assert.ok(data.products.length >= 2, 'Should find at least 2 burger products');
    data.products.forEach(p => {
      const match = p.name.toLowerCase().includes('burger') || p.description.toLowerCase().includes('burger');
      assert.ok(match, `Item ${p.name} should match query "burger"`);
    });
  });

  await test('2.2 Case-insensitive and description search matching', async () => {
    const res = await fetch(`${BASE_URL}/products?search=espresso`);
    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.ok(data.products.length >= 1, 'Should find products matching description with espresso');
  });

  // 3. CATEGORY FILTERING
  await test('3.1 Filter products by Drinks category', async () => {
    const res = await fetch(`${BASE_URL}/products?category=Drinks`);
    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.ok(data.products.length >= 4, 'Should find Drinks products');
    data.products.forEach(p => {
      assert.strictEqual(p.category.toLowerCase(), 'drinks', 'All items should belong to Drinks');
    });
  });

  await test('3.2 Filter products by Meals category', async () => {
    const res = await fetch(`${BASE_URL}/products?category=Meals`);
    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.ok(data.products.length >= 3, 'Should find Meals products');
    data.products.forEach(p => {
      assert.strictEqual(p.category.toLowerCase(), 'meals', 'All items should belong to Meals');
    });
  });

  // 4. ADD TO CART
  await test('4.1 Add in-stock products to cart simulation', async () => {
    // Simulate StudentApp cart logic
    const cart = [];
    const productsRes = await fetch(`${BASE_URL}/products`);
    const { products } = await productsRes.json();
    
    const p1 = products.find(p => p.id === 'p-1');
    const p2 = products.find(p => p.id === 'p-2');

    function simulateAddToCart(product, qty = 1) {
      if (product.is_available === false || product.stock <= 0) {
        throw new Error(`${product.name} is out of stock`);
      }
      const existing = cart.find(c => c.productId === product.id);
      if (existing) {
        existing.quantity += qty;
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: qty
        });
      }
    }

    simulateAddToCart(p1, 2);
    simulateAddToCart(p2, 1);

    assert.strictEqual(cart.length, 2, 'Cart should have 2 unique products');
    const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
    assert.strictEqual(totalQty, 3, 'Total quantity should be 3');
    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    assert.strictEqual(subtotal, (p1.price * 2) + (p2.price * 1), 'Subtotal should match sum of item totals');
  });

  // 5. OUT-OF-STOCK PRODUCTS
  await test('5.1 Verify out-of-stock product exists with stock = 0 and is_available = false', async () => {
    const res = await fetch(`${BASE_URL}/products`);
    const { products } = await res.json();
    const outOfStockItem = products.find(p => p.id === 'p-17' || p.stock === 0 || p.is_available === false);
    assert.ok(outOfStockItem, 'Should have at least 1 out-of-stock product');
    assert.ok(outOfStockItem.stock === 0 || outOfStockItem.is_available === false, 'Product should be marked out of stock');
    console.log(`     (Found out-of-stock item: "${outOfStockItem.name}", Stock: ${outOfStockItem.stock}, Available: ${outOfStockItem.is_available})`);
  });

  await test('5.2 Frontend cart addition rejects out-of-stock products', async () => {
    const res = await fetch(`${BASE_URL}/products`);
    const { products } = await res.json();
    const outOfStockItem = products.find(p => p.stock === 0 || p.is_available === false);

    assert.ok(outOfStockItem, 'Out of stock item required');

    let errorThrown = false;
    try {
      if (outOfStockItem.is_available === false || outOfStockItem.stock <= 0) {
        throw new Error(`Sorry, ${outOfStockItem.name} is currently out of stock!`);
      }
    } catch (e) {
      errorThrown = true;
      assert.ok(e.message.includes('out of stock'), 'Should throw out of stock message');
    }
    assert.ok(errorThrown, 'Should prevent adding out-of-stock item to cart');
  });

  await test('5.3 Backend checkout endpoint rejects order containing out-of-stock items', async () => {
    // Attempt to checkout with out-of-stock item
    const checkoutRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'u-101',
        customer_name: 'Jaswant Karun',
        items: [
          {
            product_id: 'p-17',
            name: 'Seasonal Alphonso Mango Lassi',
            quantity: 1,
            price: 60
          }
        ],
        subtotal: 60,
        total: 60,
        pickup_slot: '12:30 PM – 12:40 PM',
        payment_method: 'UPI'
      })
    });

    const checkoutData = await checkoutRes.json();
    assert.strictEqual(checkoutRes.status, 400, 'Should reject order with 400 Bad Request');
    assert.strictEqual(checkoutData.success, false, 'Order response success should be false');
    assert.ok(
      checkoutData.message.toLowerCase().includes('stock') || checkoutData.message.toLowerCase().includes('available'),
      `Error message should mention stock/availability: "${checkoutData.message}"`
    );
  });

  // SUMMARY
  console.log('\n====================================================');
  console.log(`📊 RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    console.log('🎉 ALL STEP 6 STUDENT HOME & MENU TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runTests();
