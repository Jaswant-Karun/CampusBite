const express = require('express');
const router = express.Router();
const db = require('../data/db');

// GET all products with filtering & search
router.get('/', (req, res) => {
  let products = [...db.data.products];
  const { category, search, veg, popular, stall_id } = req.query;

  if (stall_id && stall_id !== 'all') {
    products = products.filter(p => p.stall_id === stall_id);
  }

  if (category && category !== 'All') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  if (veg !== undefined) {
    const isVeg = veg === 'true';
    products = products.filter(p => p.is_veg === isVeg);
  }

  if (popular === 'true') {
    products = products.filter(p => p.popular);
  }

  res.json({
    success: true,
    count: products.length,
    products: products
  });
});

// GET single product
router.get('/:id', (req, res) => {
  const product = db.data.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, product });
});

// POST create new product (Admin)
router.post('/', async (req, res) => {
  const { 
    name, 
    description, 
    price, 
    category, 
    stock, 
    is_veg, 
    image, 
    image_url, 
    image_emoji, 
    calories, 
    prep_time,
    is_available 
  } = req.body;

  // 1. Validation: Product Name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ 
      success: false, 
      message: 'Product name is required (minimum 2 characters)' 
    });
  }

  // 2. Validation: Price
  if (price === undefined || price === null || price === '') {
    return res.status(400).json({ 
      success: false, 
      message: 'Product price is required' 
    });
  }
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Price must be a valid positive number greater than 0' 
    });
  }

  // 3. Validation: Category
  if (!category || typeof category !== 'string' || !category.trim()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Product category is required' 
    });
  }

  // 4. Validation: Stock
  let numStock = 25;
  if (stock !== undefined && stock !== null && stock !== '') {
    numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock must be a non-negative number (0 or higher)' 
      });
    }
  }

  // 5. Image & Availability
  const resolvedImage = (image || image_url || '').trim();
  const resolvedAvailability = is_available !== undefined ? Boolean(is_available) : true;

  const newProduct = {
    id: 'p-' + Date.now(),
    name: name.trim(),
    description: description ? description.trim() : 'Freshly prepared at Campus Canteen',
    price: numPrice,
    category: category.trim(),
    image: resolvedImage,
    image_url: resolvedImage,
    image_emoji: image_emoji || 'CB',
    stock: numStock,
    is_available: resolvedAvailability,
    availability: resolvedAvailability,
    rating: 5.0,
    prep_time: prep_time ? prep_time.trim() : '5-8 mins',
    is_veg: is_veg === true || is_veg === 'true',
    popular: false,
    calories: calories || '320 kcal'
  };

  db.data.products.unshift(newProduct);
  db.saveData();

  // Sync to MongoDB if available
  try {
    const { Product } = require('../data/mongo');
    if (Product) {
      await Product.create(newProduct);
    }
  } catch (err) {
    // Mongo offline fallback handled
  }

  // Broadcast menu addition to all clients (Real-time student catalogue reflection)
  try {
    const eventBus = require('../services/eventBus');
    eventBus.broadcast({
      type: 'product_added',
      targetRole: 'all',
      title: 'New Dish on Menu: ' + newProduct.name,
      message: `${newProduct.name} is now available at ₹${newProduct.price}`,
      data: { productId: newProduct.id, price: newProduct.price, product: newProduct }
    });
  } catch (e) {}

  res.status(201).json({
    success: true,
    message: 'Product added successfully',
    product: newProduct
  });
});

// PUT update product / price / category / stock / availability / image (Admin)
router.put('/:id', async (req, res) => {
  const index = db.data.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const current = db.data.products[index];

  // 1. Validation: Name (if provided)
  if (req.body.name !== undefined) {
    if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product name must be at least 2 characters' 
      });
    }
  }

  // 2. Validation: Price (if provided)
  let parsedPrice = current.price;
  if (req.body.price !== undefined && req.body.price !== null && req.body.price !== '') {
    const num = Number(req.body.price);
    if (isNaN(num) || num <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Price must be a valid positive number greater than 0' 
      });
    }
    parsedPrice = num;
  }

  // 3. Validation: Category (if provided)
  let parsedCategory = current.category;
  if (req.body.category !== undefined) {
    if (!req.body.category || typeof req.body.category !== 'string' || !req.body.category.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category cannot be empty' 
      });
    }
    parsedCategory = req.body.category.trim();
  }

  // 4. Validation: Stock (if provided)
  let parsedStock = current.stock;
  if (req.body.stock !== undefined && req.body.stock !== null && req.body.stock !== '') {
    const numStock = Number(req.body.stock);
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock must be a non-negative number' 
      });
    }
    parsedStock = numStock;
  }

  // 5. Image & Availability
  const resolvedImage = req.body.image !== undefined 
    ? req.body.image 
    : (req.body.image_url !== undefined ? req.body.image_url : (current.image || current.image_url || ''));

  const parsedAvailability = req.body.is_available !== undefined 
    ? Boolean(req.body.is_available) 
    : (req.body.availability !== undefined ? Boolean(req.body.availability) : current.is_available);

  const updated = {
    ...current,
    ...req.body,
    name: req.body.name !== undefined ? req.body.name.trim() : current.name,
    category: parsedCategory,
    price: parsedPrice,
    stock: parsedStock,
    is_available: parsedAvailability,
    availability: parsedAvailability,
    image: resolvedImage,
    image_url: resolvedImage,
    prep_time: req.body.prep_time !== undefined ? req.body.prep_time : current.prep_time,
    description: req.body.description !== undefined ? req.body.description.trim() : current.description,
    is_veg: req.body.is_veg !== undefined ? (req.body.is_veg === true || req.body.is_veg === 'true') : current.is_veg,
    image_emoji: req.body.image_emoji !== undefined ? req.body.image_emoji : current.image_emoji
  };

  db.data.products[index] = updated;
  db.saveData();

  // Sync to MongoDB if available
  try {
    const { Product } = require('../data/mongo');
    if (Product) {
      await Product.findOneAndUpdate({ id: req.params.id }, updated, { upsert: true });
    }
  } catch (err) {}

  // Broadcast price/product change to all clients (Real-time student catalogue reflection)
  try {
    const eventBus = require('../services/eventBus');
    const priceChanged = current.price !== updated.price;
    eventBus.broadcast({
      type: priceChanged ? 'price_updated' : 'product_updated',
      targetRole: 'all',
      title: priceChanged ? 'Food Price Updated' : 'Menu Catalog Updated',
      message: priceChanged 
        ? `${updated.name} price updated to ₹${updated.price}` 
        : `${updated.name} details were updated`,
      data: { 
        productId: updated.id, 
        newPrice: updated.price, 
        stock: updated.stock, 
        is_available: updated.is_available,
        category: updated.category,
        product: updated 
      }
    });
  } catch (e) {}

  res.json({
    success: true,
    message: 'Product updated successfully',
    product: updated
  });
});

// DELETE product (Admin)
router.delete('/:id', async (req, res) => {
  const index = db.data.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const deleted = db.data.products.splice(index, 1);
  db.saveData();

  try {
    const { Product } = require('../data/mongo');
    if (Product) {
      await Product.deleteOne({ id: req.params.id });
    }
  } catch (err) {}

  // Broadcast deletion to all clients
  try {
    const eventBus = require('../services/eventBus');
    eventBus.broadcast({
      type: 'product_deleted',
      targetRole: 'all',
      title: 'Menu Item Removed',
      message: `${deleted[0].name} was removed from the canteen menu`,
      data: { productId: req.params.id }
    });
  } catch (e) {}

  res.json({
    success: true,
    message: 'Product deleted',
    product: deleted[0]
  });
});

module.exports = router;
