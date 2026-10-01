/**
 * CampusBite MongoDB Integration
 * Powered by Mongoose ODM connecting to local or cloud MongoDB database
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusbite';

// ==========================================
// Mongoose Schemas & Models
// ==========================================

// User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['student', 'staff', 'admin'], default: 'student' },
  studentId: { type: String },
  department: { type: String },
  loyalty_points: { type: Number, default: 0 },
  wallet_balance: { type: Number, default: 850 },
  avatar: { type: String, default: 'JK' }
}, { timestamps: true });

// Product Schema
const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image_emoji: { type: String, default: 'CB' },
  stock: { type: Number, default: 20 },
  is_available: { type: Boolean, default: true },
  rating: { type: Number, default: 4.8 },
  prep_time: { type: String, default: '8 mins' },
  is_veg: { type: Boolean, default: true },
  popular: { type: Boolean, default: false },
  calories: { type: String, default: '300 kcal' }
}, { timestamps: true });

// Order Schema
const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  customer_name: { type: String, required: true },
  customer_phone: { type: String },
  items: [{
    product_id: String,
    name: String,
    price: Number,
    quantity: Number,
    customization: String,
    image_emoji: String
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  coupon_code: { type: String },
  total_amount: { type: Number, required: true },
  payment_method: { type: String, default: 'UPI' },
  payment_status: { type: String, default: 'Paid (Simulated)' },
  order_status: { 
    type: String, 
    enum: ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
    default: 'Placed' 
  },
  pickup_slot: { type: String, required: true },
  pickup_counter: { type: Number, default: 1 },
  loyalty_points_earned: { type: Number, default: 0 }
}, { timestamps: true });

// Coupon Schema
const CouponSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, uppercase: true },
  description: { type: String },
  discount_type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  discount_value: { type: Number, required: true },
  minimum_order: { type: Number, default: 50 },
  max_discount: { type: Number, default: 100 },
  expiry_date: { type: String },
  is_active: { type: Boolean, default: true },
  badge: { type: String, default: 'Special Offer' }
}, { timestamps: true });

// Review Schema
const ReviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  order_id: { type: String, required: true },
  user_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  food_quality: { type: Number, default: 5 },
  service_speed: { type: Number, default: 5 },
  app_experience: { type: Number, default: 5 },
  comment: { type: String }
}, { timestamps: true });

// Demand Prediction Schema
const DemandPredictionSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  category: { type: String },
  timeSlot: { type: String },
  expectedDemand: { type: Number, required: true },
  currentStock: { type: Number, required: true },
  recommendedPrep: { type: Number, default: 0 },
  confidence: { type: String, default: '92%' },
  urgency: { type: String, default: 'Normal' },
  keyDriver: { type: String }
}, { timestamps: true });

// Compile Models
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const Coupon = mongoose.model('Coupon', CouponSchema);
const Review = mongoose.model('Review', ReviewSchema);
const DemandPrediction = mongoose.model('DemandPrediction', DemandPredictionSchema);

// Connection Manager & Seeder
class MongoManager {
  constructor() {
    this.isConnected = false;
    this.connectionUri = MONGO_URI;
  }

  async connect(initialSeedData) {
    try {
      console.log(`Connecting to MongoDB at: ${this.connectionUri} ...`);
      await mongoose.connect(this.connectionUri, {
        serverSelectionTimeoutMS: 5000
      });
      this.isConnected = true;
      console.log(` [MongoDB] Connected successfully to ${this.connectionUri}`);

      if (initialSeedData) {
        await this.seedIfEmpty(initialSeedData);
      }
    } catch (err) {
      console.warn(` [MongoDB] Connection notice: ${err.message}. Operating with hybrid in-memory sync.`);
      this.isConnected = false;
    }
  }

  async seedIfEmpty(seedData) {
    try {
      const productCount = await Product.countDocuments();
      if (productCount === 0 && seedData.products) {
        console.log(` [MongoDB] Seeding initial products collection...`);
        await Product.insertMany(seedData.products);
      }

      const userCount = await User.countDocuments();
      if (userCount === 0 && seedData.users) {
        console.log(` [MongoDB] Seeding initial users collection...`);
        await User.insertMany(seedData.users);
      }

      const orderCount = await Order.countDocuments();
      if (orderCount === 0 && seedData.orders) {
        console.log(` [MongoDB] Seeding initial orders collection...`);
        await Order.insertMany(seedData.orders);
      }

      const couponCount = await Coupon.countDocuments();
      if (couponCount === 0 && seedData.coupons) {
        console.log(` [MongoDB] Seeding initial coupons collection...`);
        await Coupon.insertMany(seedData.coupons);
      }

      const reviewCount = await Review.countDocuments();
      if (reviewCount === 0 && seedData.reviews) {
        console.log(` [MongoDB] Seeding initial reviews collection...`);
        await Review.insertMany(seedData.reviews);
      }
      console.log(` [MongoDB] Database synchronized and populated!`);
    } catch (e) {
      console.error(`Error during MongoDB seeding:`, e);
    }
  }

  // Model accessors
  models() {
    return { User, Product, Order, Coupon, Review, DemandPrediction };
  }
}

const mongoManager = new MongoManager();

module.exports = {
  mongoManager,
  User,
  Product,
  Order,
  Coupon,
  Review,
  DemandPrediction
};
