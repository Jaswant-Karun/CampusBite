const express = require('express');
const router = express.Router();
const db = require('../data/db');

// GET all customer reviews
router.get('/', (req, res) => {
  const reviews = [...db.data.reviews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  // Calculate average rating
  const avg = reviews.length 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 4.5;

  res.json({
    success: true,
    avg_rating: Number(avg),
    count: reviews.length,
    reviews: reviews
  });
});

// POST submit review
router.post('/', async (req, res) => {
  const { order_id, user_name, rating, food_quality, service_speed, app_experience, comment } = req.body;

  if (!rating) {
    return res.status(400).json({ success: false, message: 'Rating is required' });
  }

  const newReview = {
    id: 'r-' + Date.now(),
    order_id: order_id || 'CB' + Math.floor(1000 + Math.random() * 900),
    user_name: user_name || 'Campus Student',
    rating: Number(rating),
    food_quality: Number(food_quality) || 5,
    service_speed: Number(service_speed) || 5,
    app_experience: Number(app_experience) || 5,
    comment: comment || 'Food was delicious and pickup was completely queue-free!',
    created_at: new Date().toISOString()
  };

  db.data.reviews.unshift(newReview);
  
  // Update aggregate ratings in analytics
  const allRatings = db.data.reviews.map(r => r.rating);
  db.data.analytics.avg_rating = Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1));

  db.saveData();

  // Sync to MongoDB if available
  try {
    const { Review: MongoReview } = require('../data/mongo');
    if (MongoReview) {
      await MongoReview.create(newReview);
    }
  } catch (err) {}

  res.status(201).json({
    success: true,
    message: 'Thank you for your feedback! Rating submitted successfully.',
    review: newReview
  });
});

module.exports = router;
