const http = require('http');

async function testFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  console.log('--- TESTING 4 SPECIAL FEATURES ---');
  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Check frontend index.html
    const indexRes = await testFetch('http://localhost:3000/');
    assert(indexRes.status === 200, 'Frontend index.html loads with 200 OK');
    assert(indexRes.body.includes('voice-order.js'), 'voice-order.js script included');
    assert(indexRes.body.includes('timetable-sync.js'), 'timetable-sync.js script included');
    assert(indexRes.body.includes('upi-payment.js'), 'upi-payment.js script included');
    assert(indexRes.body.includes('spin-wheel.js'), 'spin-wheel.js script included');

    assert(indexRes.body.includes('id="voice-order-modal"'), 'Voice Order Modal present');
    assert(indexRes.body.includes('id="timetable-sync-modal"'), 'Timetable Sync Modal present');
    assert(indexRes.body.includes('id="upi-payment-modal"'), 'UPI Payment Modal present');
    assert(indexRes.body.includes('id="spin-wheel-modal"'), 'Spin Wheel Modal present');

    // 2. Check each script file directly
    const scripts = ['voice-order.js', 'timetable-sync.js', 'upi-payment.js', 'spin-wheel.js'];
    for (const s of scripts) {
      const sRes = await testFetch(`http://localhost:3000/js/${s}`);
      assert(sRes.status === 200 && sRes.body.length > 500, `Script /js/${s} serves valid JS (length: ${sRes.body.length})`);
    }

    // 3. Test Coupon validation for Spin Wheel Rewards
    const couponsToTest = ['SPIN20', 'CHEESE', 'FREECHAI', 'BENTO30', 'SNACK15'];
    for (const code of couponsToTest) {
      const applyRes = await testFetch('http://localhost:3000/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, order_amount: 150 })
      });
      const parsed = JSON.parse(applyRes.body);
      assert(parsed.success === true && parsed.coupon.code === code, `Spin wheel coupon ${code} applies successfully (discount: ₹${parsed.discount_amount || parsed.coupon.discount_value})`);
    }

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exit(1);
  }
}

runTests();
