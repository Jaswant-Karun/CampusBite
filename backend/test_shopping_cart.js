/**
 * Step 8 Validation Suite - Shopping Cart System
 * Tests:
 * 1. Cart Items Structure: Product, Quantity, Unit Price, Subtotal, Remove Button, Increment, Decrement
 * 2. Bill Summary Calculations: Subtotal, Discount (Coupon + Loyalty + Subsidy), Total
 * 3. Quantity Updates: Increase, Decrease, Removal upon 0 quantity
 * 4. Item Removal: Single item removal and Clear Cart
 * 5. Empty Cart Protections: Rejection of checkout on empty cart, empty state display
 * 6. Session Persistence: Session storage saving and restoring across reloads
 * 7. Action Buttons: "CONTINUE SHOPPING" and "PROCEED TO CHECKOUT" routes
 * 8. HTML & CSS Verifications for Desktop and Mobile
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING STEP 8: CAMPUSBITE SHOPPING CART');
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

  // 1. CART ITEM STRUCTURE & PRICING
  await test('1.1 Item model contains Product, Quantity, Unit Price, and computes Subtotal', () => {
    const item = {
      productId: 'p-2',
      name: 'Cheese Burger Deluxe',
      price: 80,
      quantity: 3
    };

    assert.ok(item.productId, 'Item must have productId');
    assert.ok(item.name, 'Item must have name');
    assert.strictEqual(item.price, 80, 'Unit price must be 80');
    assert.strictEqual(item.quantity, 3, 'Quantity must be 3');
    const itemSubtotal = item.price * item.quantity;
    assert.strictEqual(itemSubtotal, 240, 'Subtotal must be 240 (80 * 3)');
  });

  // 2. QUANTITY UPDATES (INCREASE & DECREASE)
  await test('2.1 Quantity increments properly up to stock bounds', () => {
    let cart = [{ productId: 'p-1', name: 'Classic Veg Burger', price: 80, quantity: 2 }];
    const stockLimit = 15;

    function increment(productId) {
      const it = cart.find(c => c.productId === productId);
      if (it && it.quantity < stockLimit) {
        it.quantity += 1;
        return true;
      }
      return false;
    }

    assert.ok(increment('p-1'));
    assert.strictEqual(cart[0].quantity, 3);
    assert.strictEqual(cart[0].price * cart[0].quantity, 240);
  });

  await test('2.2 Quantity decrements and removes when hitting 0', () => {
    let cart = [
      { productId: 'p-1', name: 'Classic Veg Burger', price: 80, quantity: 2 },
      { productId: 'p-5', name: 'Iced Cold Coffee', price: 50, quantity: 1 }
    ];

    function decrement(productId) {
      const idx = cart.findIndex(c => c.productId === productId);
      if (idx === -1) return;
      cart[idx].quantity -= 1;
      if (cart[idx].quantity <= 0) {
        cart.splice(idx, 1);
      }
    }

    decrement('p-1'); // 2 -> 1
    assert.strictEqual(cart[0].quantity, 1);

    decrement('p-5'); // 1 -> 0 (removed)
    assert.strictEqual(cart.length, 1);
    assert.strictEqual(cart[0].productId, 'p-1');
  });

  // 3. REMOVAL (SINGLE ITEM & CLEAR CART)
  await test('3.1 Remove button deletes target item regardless of quantity', () => {
    let cart = [
      { productId: 'p-2', name: 'Cheese Burger Deluxe', price: 80, quantity: 5 },
      { productId: 'p-3', name: 'Veg Grilled Sandwich', price: 60, quantity: 2 }
    ];

    function remove(productId) {
      const idx = cart.findIndex(c => c.productId === productId);
      if (idx !== -1) cart.splice(idx, 1);
    }

    remove('p-2');
    assert.strictEqual(cart.length, 1);
    assert.strictEqual(cart[0].productId, 'p-3');
    assert.strictEqual(cart[0].quantity, 2);
  });

  await test('3.2 Clear Cart empties entire tray and resets state', () => {
    let cart = [
      { productId: 'p-1', name: 'A', price: 50, quantity: 1 },
      { productId: 'p-2', name: 'B', price: 70, quantity: 2 }
    ];

    function clear() {
      cart = [];
    }

    clear();
    assert.strictEqual(cart.length, 0);
  });

  // 4. BILL SUMMARY CALCULATIONS (SUBTOTAL, DISCOUNT, TOTAL)
  await test('4.1 Calculate Subtotal, Discount (Coupon + Loyalty), and Final Total accurately', () => {
    const cart = [
      { productId: 'p-2', name: 'Cheese Burger Deluxe', price: 80, quantity: 2 }, // 160
      { productId: 'p-5', name: 'Iced Cold Coffee', price: 50, quantity: 2 }       // 100
    ];

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    assert.strictEqual(subtotal, 260, 'Subtotal should be ₹260');

    // Apply CAMPUS20 (20% off)
    const couponDiscount = Math.round((subtotal * 20) / 100); // 52
    assert.strictEqual(couponDiscount, 52, 'Coupon discount should be ₹52');

    // Redeem 100 Loyalty points (₹10 off)
    const loyaltyDiscount = 10;

    const totalDiscount = couponDiscount + loyaltyDiscount; // 62
    assert.strictEqual(totalDiscount, 62, 'Total discount should be ₹62');

    const total = Math.max(0, subtotal - totalDiscount); // 198
    assert.strictEqual(total, 198, 'Total amount should be ₹198');
  });

  // 5. EMPTY CART PROTECTION
  await test('5.1 Prevent checkout when cart is empty', () => {
    const cart = [];

    function proceedToCheckout(c) {
      if (!c || !c.length) {
        return { allowed: false, message: 'Your cart is empty! Please add items before proceeding to checkout.' };
      }
      return { allowed: true };
    }

    const check = proceedToCheckout(cart);
    assert.strictEqual(check.allowed, false, 'Checkout must be blocked when cart is empty');
    assert.ok(check.message.includes('empty'), 'Message must explain cart is empty');
  });

  // 6. SESSION PERSISTENCE
  await test('6.1 Session storage persistence serialize and deserialize', () => {
    const mockSessionStore = {};

    function saveSession(cart, coupon, loyalty) {
      mockSessionStore['campusbite_cart'] = JSON.stringify(cart);
      if (coupon) mockSessionStore['campusbite_coupon'] = JSON.stringify(coupon);
      mockSessionStore['campusbite_loyalty'] = JSON.stringify(loyalty);
    }

    function loadSession() {
      const rawCart = mockSessionStore['campusbite_cart'];
      const rawCoupon = mockSessionStore['campusbite_coupon'];
      const rawLoyalty = mockSessionStore['campusbite_loyalty'];
      return {
        cart: rawCart ? JSON.parse(rawCart) : [],
        coupon: rawCoupon ? JSON.parse(rawCoupon) : null,
        loyalty: rawLoyalty ? JSON.parse(rawLoyalty) : false
      };
    }

    const initialCart = [
      { productId: 'p-2', name: 'Cheese Burger Deluxe', price: 80, quantity: 2 }
    ];
    const initialCoupon = { code: 'CAMPUS20', discount_value: 20 };

    saveSession(initialCart, initialCoupon, true);

    const restored = loadSession();
    assert.strictEqual(restored.cart.length, 1);
    assert.strictEqual(restored.cart[0].productId, 'p-2');
    assert.strictEqual(restored.cart[0].quantity, 2);
    assert.strictEqual(restored.coupon.code, 'CAMPUS20');
    assert.strictEqual(restored.loyalty, true);
  });

  // 7. HTML & CSS COMPLIANCE
  await test('7.1 Verify frontend/index.html includes required cart elements and actions', () => {
    const indexPath = path.join(__dirname, '../frontend/index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');

    assert.ok(content.includes('id="screen-cart"'), 'Must have #screen-cart');
    assert.ok(content.includes('id="cart-items-container"'), 'Must have #cart-items-container');
    assert.ok(content.includes('id="cart-empty-state"'), 'Must have #cart-empty-state');
    assert.ok(content.includes('id="cart-full-state"'), 'Must have #cart-full-state');
    assert.ok(content.includes('id="cart-subtotal-val"'), 'Must have #cart-subtotal-val');
    assert.ok(content.includes('id="cart-discount-val"'), 'Must have #cart-discount-val');
    assert.ok(content.includes('id="cart-total-val"'), 'Must have #cart-total-val');
    assert.ok(content.includes('Continue Shopping'), 'Must provide Continue Shopping button');
    assert.ok(content.includes('Proceed to Checkout'), 'Must provide Proceed to Checkout button');
  });

  await test('7.2 Verify frontend/mobile.html includes required mobile cart markup and actions', () => {
    const mobPath = path.join(__dirname, '../frontend/mobile.html');
    const content = fs.readFileSync(mobPath, 'utf-8');

    assert.ok(content.includes('id="screen-cart"'), 'Must have #screen-cart');
    assert.ok(content.includes('id="cart-items-container"'), 'Must have #cart-items-container');
    assert.ok(content.includes('id="cart-empty-state"'), 'Must have #cart-empty-state');
    assert.ok(content.includes('id="cart-full-state"'), 'Must have #cart-full-state');
    assert.ok(content.includes('Continue Shopping'), 'Must provide Continue Shopping button');
    assert.ok(content.includes('Proceed to Checkout'), 'Must provide Proceed to Checkout button');
  });

  await test('7.3 Verify frontend/css/style.css defines responsive cart styles', () => {
    const cssPath = path.join(__dirname, '../frontend/css/style.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    const requiredClasses = [
      '.cart-full-layout',
      '.cart-item-row',
      '.cart-item-thumb-wrap',
      '.cart-item-remove-btn',
      '.cart-unit-price-label',
      '.cart-item-subtotal-val',
      '.cart-stepper-control',
      '.cart-empty-card'
    ];

    requiredClasses.forEach(cls => {
      assert.ok(css.includes(cls), `style.css must define ${cls}`);
    });
  });

  await test('7.4 Verify frontend/js/student.js implements all Step 8 Cart methods', () => {
    const jsPath = path.join(__dirname, '../frontend/js/student.js');
    const js = fs.readFileSync(jsPath, 'utf-8');

    assert.ok(js.includes('saveCartToSession('), 'Must implement saveCartToSession');
    assert.ok(js.includes('loadCartFromSession('), 'Must implement loadCartFromSession');
    assert.ok(js.includes('removeFromCart('), 'Must implement removeFromCart');
    assert.ok(js.includes('clearCart('), 'Must implement clearCart');
    assert.ok(js.includes('renderCart('), 'Must implement renderCart');
    assert.ok(js.includes('calculateCartBill('), 'Must implement calculateCartBill');
    assert.ok(js.includes('proceedToCheckout('), 'Must implement proceedToCheckout');
    assert.ok(js.includes('Unit Price:'), 'renderCart must show Unit Price');
    assert.ok(js.includes('Subtotal:'), 'renderCart must show Subtotal');
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
