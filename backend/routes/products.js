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
router.post('/', (req, res) => {
  const { name, description, price, category, stock, is_veg, image_emoji, calories, prep_time } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
  }

  const newProduct = {
    id: 'p-' + Date.now(),
    name,
    description: description || 'Freshly prepared at Campus Canteen',
    price: Number(price),
    category,
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

  res.status(201).json({
    success: true,
    message: 'Product added successfully',
    product: newProduct
  });
});

// PUT update product / stock / availability (Admin)
router.put('/:id', (req, res) => {
  const index = db.data.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const current = db.data.products[index];
  const updated = {
    ...current,
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : current.price,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : current.stock,
    is_available: req.body.is_available !== undefined ? Boolean(req.body.is_available) : current.is_available
  };

  db.data.products[index] = updated;
  db.saveData();

  res.json({
    success: true,
    message: 'Product updated successfully',
    product: updated
  });
});

// DELETE product
router.delete('/:id', (req, res) => {
  const index = db.data.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const deleted = db.data.products.splice(index, 1);
  db.saveData();

  res.json({
    success: true,
    message: 'Product deleted',
    product: deleted[0]
  });
});

module.exports = router;
