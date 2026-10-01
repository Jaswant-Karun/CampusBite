const express = require('express');
const router = express.Router();
const db = require('../data/db');

// GET all products with filtering & search
router.get('/', (req, res) => {
  let products = [...db.data.products];
  const { category, search, veg, popular } = req.query;

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
  const { name, description, price, category, stock, is_veg, image_emoji, calories, prep_time } = req.body;

  if (!name || price === undefined || price === null || !category) {
    return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    return res.status(400).json({ success: false, message: 'Price must be a valid positive number' });
  }

  const newProduct = {
    id: 'p-' + Date.now(),
    name: name.trim(),
    description: description || 'Freshly prepared at Campus Canteen',
    price: numPrice,
    category: category.trim(),
    image_emoji: image_emoji || '🍲',
    stock: stock !== undefined ? Number(stock) : 25,
    is_available: true,
    rating: 5.0,
    prep_time: prep_time || '5-10 mins',
    is_veg: is_veg === true || is_veg === 'true',
    popular: false,
    calories: calories || '300 kcal'
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

  // Broadcast menu addition
  try {
    const eventBus = require('../services/eventBus');
    eventBus.broadcast({
      type: 'product_added',
      targetRole: 'all',
      title: 'New Dish on Menu! 🍽️',
      message: `${newProduct.name} is now available at ₹${newProduct.price}`,
      data: { productId: newProduct.id, price: newProduct.price }
    });
  } catch (e) {}

  res.status(201).json({
    success: true,
    message: 'Product added successfully',
    product: newProduct
  });
});

// PUT update product / price / stock / availability (Admin)
router.put('/:id', async (req, res) => {
  const index = db.data.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const current = db.data.products[index];
  let parsedPrice = current.price;
  if (req.body.price !== undefined && req.body.price !== null && req.body.price !== '') {
    const num = Number(req.body.price);
    if (!isNaN(num) && num >= 0) {
      parsedPrice = num;
    }
  }

  const updated = {
    ...current,
    ...req.body,
    name: req.body.name !== undefined ? req.body.name.trim() : current.name,
    category: req.body.category !== undefined ? req.body.category.trim() : current.category,
    price: parsedPrice,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : current.stock,
    is_available: req.body.is_available !== undefined ? Boolean(req.body.is_available) : current.is_available,
    prep_time: req.body.prep_time !== undefined ? req.body.prep_time : current.prep_time,
    description: req.body.description !== undefined ? req.body.description : current.description,
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

  // Broadcast price/product change to all clients
  try {
    const eventBus = require('../services/eventBus');
    const priceChanged = current.price !== updated.price;
    eventBus.broadcast({
      type: priceChanged ? 'price_updated' : 'product_updated',
      targetRole: 'all',
      title: priceChanged ? 'Food Price Updated 🏷️' : 'Menu Updated',
      message: priceChanged 
        ? `${updated.name} price updated to ₹${updated.price}` 
        : `${updated.name} details were updated`,
      data: { productId: updated.id, newPrice: updated.price, is_available: updated.is_available }
    });
  } catch (e) {}

  res.json({
    success: true,
    message: 'Product updated successfully',
    product: updated
  });
});

// DELETE product
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

  res.json({
    success: true,
    message: 'Product deleted',
    product: deleted[0]
  });
});

module.exports = router;
