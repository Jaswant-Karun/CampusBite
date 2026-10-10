/**
 * Automated Verification Suite for Step 20: Admin Product Management
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./backend/server');

function request(server, method, urlPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: port,
        path: urlPath,
        method: method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('🚀 STEP 20: ADMIN PRODUCT MANAGEMENT VERIFICATION SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  try {
    // ----------------------------------------------------
    // TEST 1: Add Product with All 7 Fields
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Add Product (POST /api/products) ---');
    const newProductPayload = {
      name: 'Paneer Tikka Roll Special',
      description: 'Char-grilled cottage cheese with mint chutney and crunchy peppers',
      price: 95,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400',
      stock: 40,
      is_available: true,
      is_veg: true,
      prep_time: '6-8 mins'
    };

    const addRes = await request(server, 'POST', '/api/products', newProductPayload);
    assert(addRes.status === 201 && addRes.body.success, 'POST /api/products returns 201 Created');
    assert(addRes.body.product && addRes.body.product.id, 'New product assigned unique ID: ' + addRes.body.product?.id);
    const createdId = addRes.body.product.id;
    assert(addRes.body.product.name === newProductPayload.name, 'Product name saved correctly: ' + newProductPayload.name);
    assert(addRes.body.product.price === 95, 'Price saved correctly: ₹' + addRes.body.product.price);
    assert(addRes.body.product.category === 'Snacks', 'Category saved correctly: ' + addRes.body.product.category);
    assert(addRes.body.product.stock === 40, 'Stock saved correctly: ' + addRes.body.product.stock);
    assert(addRes.body.product.is_available === true, 'Availability saved correctly: true');
    assert(addRes.body.product.image.includes('unsplash'), 'Image URL saved correctly');
    assert(addRes.body.product.description === newProductPayload.description, 'Description saved correctly');

    // ----------------------------------------------------
    // TEST 2: Edit Product (Price, Category, Stock, Image, Availability)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Edit Product (PUT /api/products/:id) ---');
    
    // 2a. Change Price
    const priceUpdateRes = await request(server, 'PUT', `/api/products/${createdId}`, { price: 110 });
    assert(priceUpdateRes.status === 200 && priceUpdateRes.body.success, 'PUT price update returned 200');
    assert(priceUpdateRes.body.product.price === 110, 'Price updated to ₹110');

    // 2b. Change Category
    const catUpdateRes = await request(server, 'PUT', `/api/products/${createdId}`, { category: 'Meals' });
    assert(catUpdateRes.status === 200 && catUpdateRes.body.product.category === 'Meals', 'Category updated to "Meals"');

    // 2c. Update Stock
    const stockUpdateRes = await request(server, 'PUT', `/api/products/${createdId}`, { stock: 15 });
    assert(stockUpdateRes.status === 200 && stockUpdateRes.body.product.stock === 15, 'Stock updated to 15');

    // 2d. Upload / Change Image
    const newImageUrl = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400';
    const imgUpdateRes = await request(server, 'PUT', `/api/products/${createdId}`, { image: newImageUrl });
    assert(imgUpdateRes.status === 200 && imgUpdateRes.body.product.image === newImageUrl, 'Image URL updated');

    // 2e. Deactivate Product (Change Availability to False)
    const deactRes = await request(server, 'PUT', `/api/products/${createdId}`, { is_available: false });
    assert(deactRes.status === 200 && deactRes.body.product.is_available === false, 'Product successfully deactivated (is_available = false)');

    // Verify in Student Catalogue endpoint that changes reflect immediately
    const studentCatalogGet = await request(server, 'GET', `/api/products/${createdId}`);
    assert(studentCatalogGet.status === 200, 'Student catalogue GET /api/products/:id returned 200');
    assert(studentCatalogGet.body.product.price === 110, 'Student catalogue reflects updated price (₹110)');
    assert(studentCatalogGet.body.product.category === 'Meals', 'Student catalogue reflects updated category (Meals)');
    assert(studentCatalogGet.body.product.stock === 15, 'Student catalogue reflects updated stock (15)');
    assert(studentCatalogGet.body.product.is_available === false, 'Student catalogue reflects deactivated availability (false)');

    // 2f. Reactivate Product
    const reactRes = await request(server, 'PUT', `/api/products/${createdId}`, { is_available: true });
    assert(reactRes.status === 200 && reactRes.body.product.is_available === true, 'Product successfully reactivated (is_available = true)');

    // ----------------------------------------------------
    // TEST 3: Validation Tests (Error Handling)
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Form Validation (Invalid Inputs) ---');

    // Name too short / empty
    const badNameRes = await request(server, 'POST', '/api/products', { name: '', price: 50, category: 'Snacks' });
    assert(badNameRes.status === 400, 'Empty name rejected with 400 Bad Request');
    assert(badNameRes.body.success === false, 'Error message returned for invalid name');

    // Price <= 0 or invalid
    const badPriceRes = await request(server, 'POST', '/api/products', { name: 'Sample Item', price: -10, category: 'Snacks' });
    assert(badPriceRes.status === 400, 'Negative price rejected with 400 Bad Request');

    const zeroPriceRes = await request(server, 'POST', '/api/products', { name: 'Sample Item', price: 0, category: 'Snacks' });
    assert(zeroPriceRes.status === 400, 'Zero price rejected with 400 Bad Request');

    // Category missing
    const badCatRes = await request(server, 'POST', '/api/products', { name: 'Sample Item', price: 60, category: '' });
    assert(badCatRes.status === 400, 'Empty category rejected with 400 Bad Request');

    // Stock negative
    const badStockRes = await request(server, 'POST', '/api/products', { name: 'Sample Item', price: 60, category: 'Snacks', stock: -5 });
    assert(badStockRes.status === 400, 'Negative stock rejected with 400 Bad Request');

    // PUT Validation
    const badPutPrice = await request(server, 'PUT', `/api/products/${createdId}`, { price: -50 });
    assert(badPutPrice.status === 400, 'PUT negative price rejected with 400');

    // ----------------------------------------------------
    // TEST 4: Delete Product (Destructive Action)
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Delete Product (DELETE /api/products/:id) ---');
    const deleteRes = await request(server, 'DELETE', `/api/products/${createdId}`);
    assert(deleteRes.status === 200 && deleteRes.body.success, 'DELETE /api/products/:id returned 200 Success');

    // Verify deleted in student catalogue
    const verifyDeleted = await request(server, 'GET', `/api/products/${createdId}`);
    assert(verifyDeleted.status === 404, 'Deleted product is no longer found in catalogue (404 Not Found)');

    // ----------------------------------------------------
    // TEST 5: Frontend UI Code Requirements
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Frontend UI Code Requirements ---');
    const adminHtml = fs.readFileSync(path.join(__dirname, 'frontend/admin.html'), 'utf8');
    const adminJs = fs.readFileSync(path.join(__dirname, 'frontend/js/admin.js'), 'utf8');
    const studentJs = fs.readFileSync(path.join(__dirname, 'frontend/js/student.js'), 'utf8');

    // 7 Required Fields in Add Modal
    assert(adminHtml.includes('id="prod-name"'), 'Add modal contains Product Name (#prod-name)');
    assert(adminHtml.includes('id="prod-desc"'), 'Add modal contains Description (#prod-desc)');
    assert(adminHtml.includes('id="prod-price"'), 'Add modal contains Price (#prod-price)');
    assert(adminHtml.includes('id="prod-category"'), 'Add modal contains Category (#prod-category)');
    assert(adminHtml.includes('id="prod-image-url"') && adminHtml.includes('id="prod-image-file"'), 'Add modal contains Image URL & File Upload');
    assert(adminHtml.includes('id="prod-stock"'), 'Add modal contains Stock (#prod-stock)');
    assert(adminHtml.includes('id="prod-available"'), 'Add modal contains Availability (#prod-available)');

    // 7 Required Fields in Edit Modal
    assert(adminHtml.includes('id="edit-prod-name"'), 'Edit modal contains Product Name (#edit-prod-name)');
    assert(adminHtml.includes('id="edit-prod-desc"'), 'Edit modal contains Description (#edit-prod-desc)');
    assert(adminHtml.includes('id="edit-prod-price"'), 'Edit modal contains Price (#edit-prod-price)');
    assert(adminHtml.includes('id="edit-prod-category"'), 'Edit modal contains Category (#edit-prod-category)');
    assert(adminHtml.includes('id="edit-prod-image-url"') && adminHtml.includes('id="edit-prod-image-file"'), 'Edit modal contains Image URL & File Upload');
    assert(adminHtml.includes('id="edit-prod-stock"'), 'Edit modal contains Stock (#edit-prod-stock)');
    assert(adminHtml.includes('id="edit-prod-available"'), 'Edit modal contains Availability (#edit-prod-available)');

    // Admin JS methods
    assert(adminJs.includes('handleImagePreview'), 'Admin JS handles live image preview');
    assert(adminJs.includes('handleImageFileUpload'), 'Admin JS handles image file upload via FileReader');
    assert(adminJs.includes('handleProductSubmit'), 'Admin JS handles product creation');
    assert(adminJs.includes('handleEditProductSubmit'), 'Admin JS handles product edits');
    assert(adminJs.includes('toggleAvailability'), 'Admin JS handles availability toggle');
    assert(adminJs.includes('adjustStock'), 'Admin JS handles quick stock adjustment');
    assert(adminJs.includes('deleteProduct'), 'Admin JS handles product deletion');
    assert(adminJs.includes('confirm('), 'Confirmation prompt present before deleting product');
    assert(adminJs.includes('campusbite_product_update'), 'Admin JS broadcasts product changes via localStorage');

    // Student JS real-time sync
    assert(studentJs.includes('campusbite_product_update'), 'Student JS listens for campusbite_product_update');
    assert(studentJs.includes('campusbite:product_updated'), 'Student JS listens for in-page campusbite:product_updated event');

  } catch (err) {
    console.error('Unhandled test failure:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n========================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
