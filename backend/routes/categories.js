const express = require('express');
const router = express.Router();
const db = require('../data/db');

// GET all categories
router.get('/', (req, res) => {
  const categories = (db.data.categories || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  res.json({
    success: true,
    count: categories.length,
    categories: categories
  });
});

// GET single category by id or slug
router.get('/:idOrSlug', (req, res) => {
  const categories = db.data.categories || [];
  const query = req.params.idOrSlug.toLowerCase();
  const category = categories.find(c => c.id === query || (c.slug && c.slug.toLowerCase() === query) || (c.name && c.name.toLowerCase() === query));

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.json({
    success: true,
    category: category
  });
});

module.exports = router;
