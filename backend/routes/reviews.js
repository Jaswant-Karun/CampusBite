const express = require('express');
const router = express.Router();
const db = require('../data/db');

// Helper to calculate review aggregations
function calculateReviewStats(reviewsList) {
  if (!reviewsList || reviewsList.length === 0) {
    return {
      avg_rating: 4.8,
      count: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      sub_averages: { food_quality: 4.8, service_speed: 4.7, app_experience: 4.9 }
    };
  }

  const count = reviewsList.length;
  const sumRating = reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const avg = Number((sumRating / count).toFixed(1));

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sumFood = 0;
  let sumSpeed = 0;
  let sumApp = 0;

  reviewsList.forEach(r => {
    const star = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
    breakdown[star] = (breakdown[star] || 0) + 1;
    sumFood += Number(r.food_quality) || star;
    sumSpeed += Number(r.service_speed) || star;
    sumApp += Number(r.app_experience) || star;
  });

  return {
    avg_rating: avg,
    count: count,
    breakdown: breakdown,
    sub_averages: {
      food_quality: Number((sumFood / count).toFixed(1)),
      service_speed: Number((sumSpeed / count).toFixed(1)),
      app_experience: Number((sumApp / count).toFixed(1))
    }
  };
}

// GET all customer reviews with statistics
router.get('/', (req, res) => {
  let reviews = [...(db.data.reviews || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const { order_id, user_id, product_id, limit } = req.query;

  if (order_id) {
    reviews = reviews.filter(r => r.order_id === order_id);
  }
  if (user_id) {
    reviews = reviews.filter(r => r.user_id === user_id);
  }
  if (product_id) {
    reviews = reviews.filter(r => r.product_id === product_id);
  }

  const allReviews = [...(db.data.reviews || [])];
  const stats = calculateReviewStats(allReviews);

  const finalReviews = limit ? reviews.slice(0, parseInt(limit, 10)) : reviews;

  res.json({
    success: true,
    avg_rating: stats.avg_rating,
    count: stats.count,
    rating_breakdown: stats.breakdown,
    sub_averages: stats.sub_averages,
    recent_reviews: reviews.slice(0, 6),
    reviews: finalReviews
  });
});

// GET review eligibility check for a specific order
router.get('/check/:order_id', (req, res) => {
  const { order_id } = req.params;
  const order = (db.data.orders || []).find(o => 
    o.id === order_id || 
    (o.id && o.id.toLowerCase() === order_id.toLowerCase())
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      can_review: false,
      already_reviewed: false,
      message: `Order #${order_id} not found.`
    });
  }

  const rawStatus = (order.order_status || order.status || '').toUpperCase();
  const isCompleted = ['COMPLETED', 'DELIVERED'].includes(rawStatus);

  const existingReview = (db.data.reviews || []).find(r => r.order_id === order.id);

  if (!isCompleted) {
    return res.json({
      success: true,
      can_review: false,
      already_reviewed: false,
      order_status: order.order_status || order.status,
      message: `Reviews are only allowed after order completion. Current status is ${order.order_status || order.status}.`
    });
  }

  if (existingReview) {
    return res.json({
      success: true,
      can_review: false,
      already_reviewed: true,
      order_status: order.order_status || order.status,
      review: existingReview,
      message: `Order #${order.id} has already been reviewed.`
    });
  }

  return res.json({
    success: true,
    can_review: true,
    already_reviewed: false,
    order_status: order.order_status || order.status,
    order: {
      id: order.id,
      items: order.items || [],
      total_amount: order.total_amount
    },
    message: `Order #${order.id} is completed and eligible for review.`
  });
});

// POST submit a customer review
router.post('/', async (req, res) => {
  const {
    order_id,
    user_id,
    user_name,
    product_id,
    product_name,
    rating,
    food_quality,
    service_speed,
    app_experience,
    comment
  } = req.body;

  // 1. Validation: order_id is required
  if (!order_id || !order_id.toString().trim()) {
    return res.status(400).json({
      success: false,
      message: 'Order ID is required. Reviews must be linked to a completed canteen order.'
    });
  }

  const cleanOrderId = order_id.toString().trim();

  // 2. Validation: Find order in database
  const order = (db.data.orders || []).find(o => 
    o.id === cleanOrderId || 
    (o.id && o.id.toLowerCase() === cleanOrderId.toLowerCase())
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      message: `Order #${cleanOrderId} not found. Please provide a valid completed order.`
    });
  }

  // 3. Validation: Prevent reviews for orders that are not completed
  const rawStatus = (order.order_status || order.status || '').toUpperCase();
  const isCompleted = ['COMPLETED', 'DELIVERED'].includes(rawStatus);

  if (!isCompleted) {
    return res.status(400).json({
      success: false,
      message: `Reviews are only allowed for completed orders. Current order status: "${order.order_status || order.status}".`
    });
  }

  // 4. Validation: Prevent duplicate reviews for the same order / product
  const existingReview = (db.data.reviews || []).find(r => 
    r.order_id === order.id && 
    (!product_id || r.product_id === product_id)
  );

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: `You have already submitted a review for Order #${order.id}. Duplicate reviews are not allowed.`,
      existing_review: existingReview
    });
  }

  // 5. Validation: 1-5 star rating
  const numRating = Number(rating);
  if (!numRating || !Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be an integer between 1 and 5 stars.'
    });
  }

  // 6. Validation: Feedback comment
  if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Feedback comment is required (minimum 3 characters).'
    });
  }

  // 7. Resolve Author identity
  let authorName = user_name;
  let authorAvatar = 'ST';
  const resolvedUserId = user_id || order.user_id || 'u-101';

  if (resolvedUserId) {
    const user = (db.data.users || []).find(u => u.id === resolvedUserId);
    if (user) {
      authorName = authorName || user.name;
      authorAvatar = user.profile_image || user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : 'ST');
    }
  }
  authorName = authorName || order.customer_name || 'Campus Student';

  // 8. Resolve Product reference
  let resolvedProductName = product_name;
  if (product_id && !resolvedProductName) {
    const item = (order.items || []).find(i => i.product_id === product_id);
    if (item) {
      resolvedProductName = item.name;
    } else {
      const prod = (db.data.products || []).find(p => p.id === product_id);
      if (prod) resolvedProductName = prod.name;
    }
  }

  if (!resolvedProductName) {
    if (order.items && order.items.length > 0) {
      resolvedProductName = order.items.map(i => i.name).join(', ');
    } else {
      resolvedProductName = 'Canteen Order';
    }
  }

  // 9. Create Review Object
  const newReview = {
    id: 'r-' + Date.now(),
    order_id: order.id,
    user_id: resolvedUserId,
    user_name: authorName,
    user_avatar: authorAvatar,
    product_id: product_id || null,
    product_name: resolvedProductName,
    rating: numRating,
    food_quality: Math.max(1, Math.min(5, Number(food_quality) || numRating)),
    service_speed: Math.max(1, Math.min(5, Number(service_speed) || numRating)),
    app_experience: Math.max(1, Math.min(5, Number(app_experience) || numRating)),
    comment: comment.trim(),
    created_at: new Date().toISOString()
  };

  db.data.reviews = db.data.reviews || [];
  db.data.reviews.unshift(newReview);

  // Update aggregated ratings in analytics
  const stats = calculateReviewStats(db.data.reviews);
  if (db.data.analytics) {
    db.data.analytics.avg_rating = stats.avg_rating;
  }

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
    review: newReview,
    avg_rating: stats.avg_rating,
    total_reviews: stats.count
  });
});

module.exports = router;
