/**
 * CampusBite Server
 * Smart Campus Canteen E-Business & Management Platform
 * Powered by Node.js, Express, and MongoDB
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const couponsRoutes = require('./routes/coupons');
const loyaltyRoutes = require('./routes/loyalty');
const reviewsRoutes = require('./routes/reviews');
const analyticsRoutes = require('./routes/analytics');
const demandPredictionRoutes = require('./routes/demandPrediction');
const chatbotRoutes = require('./routes/chatbot');
const db = require('./data/db');
const { mongoManager, User, Product, Order } = require('./data/mongo');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoManager.connect(db.data);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/demand-prediction', demandPredictionRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Health check & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'CampusBite E-Business Platform',
    version: '2.0.0',
    database: {
      engine: 'MongoDB',
      connected: mongoManager.isConnected,
      uri: mongoManager.connectionUri
    },
    timestamp: new Date().toISOString(),
    database_records: {
      users: db.data.users.length,
      products: db.data.products.length,
      orders: db.data.orders.length,
      coupons: db.data.coupons.length,
      reviews: db.data.reviews.length
    }
  });
});

// Admin DB reset endpoint for clean demo runs
app.post('/api/reset-demo', async (req, res) => {
  const fresh = db.reset();
  if (mongoManager.isConnected) {
    try {
      await Product.deleteMany({});
      await Order.deleteMany({});
      await mongoManager.seedIfEmpty(fresh);
    } catch (e) {
      console.warn("MongoDB reset sync error", e);
    }
  }
  res.json({ success: true, message: 'Database reset to default demo scenario state', state: fresh });
});

// Serve frontend static files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Dedicated View Routes
app.get('/mobile', (req, res) => {
  res.sendFile(path.join(frontendPath, 'mobile.html'));
});

app.get('/desktop', (req, res) => {
  res.redirect('/');
});

app.get('/admin', (req, res) => {
  res.redirect('/#admin');
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CAMPUSBITE PLATFORM RUNNING`);
  console.log(`📦 Database: MongoDB (${mongoManager.connectionUri})`);
  console.log(`📍 Web App & API: http://localhost:${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}#admin`);
  console.log(`📱 Student Mobile:  http://localhost:${PORT}#student`);
  console.log(`====================================================`);
});
