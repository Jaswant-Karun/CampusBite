/**
 * CampusBite MongoDB Integration
 * Powered by Mongoose ODM connecting to local or cloud MongoDB database
 * Fully structured for: Users, Categories, Products, OrderItems, Orders,
 * Coupons, Reviews, LoyaltyTransactions, Notifications, and DemandPrediction.
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusbite';

// ==========================================
// 1. User Schema & Model
// ==========================================
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['student', 'staff', 'admin', 'faculty', 'STUDENT', 'ADMIN', 'STAFF', 'FACULTY'], 
    default: 'student',
    set: v => (v ? v.toLowerCase() : 'student')
  },
  studentId: { type: String },
  department: { type: String },
  loyalty_points: { type: Number, default: 0 },
  wallet_balance: { type: Number, default: 850 },
  avatar: { type: String, default: 'JK' },
  profile_image: { type: String, default: '' },
  account_status: { type: String, default: 'Active Verified' },
  joined_date: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// ==========================================
// 2. Category Schema & Model
// ==========================================
const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, default: '🍔' },
  description: { type: String },
  sort_order: { type: Number, default: 0 }
}, { timestamps: true });

// ==========================================
// 3. Product Schema & Model
// ==========================================
const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  category_id: { type: String },
  image: { type: String },
  image_url: { type: String },
  image_emoji: { type: String, default: 'CB' },
  stock: { type: Number, default: 20 },
  is_available: { type: Boolean, default: true },
  availability: { type: Boolean, default: true },
  rating: { type: Number, default: 4.8 },
  prep_time: { type: String, default: '8 mins' },
  is_veg: { type: Boolean, default: true },
  popular: { type: Boolean, default: false },
  calories: { type: String, default: '300 kcal' }
}, { timestamps: true });

// ==========================================
// 4. Order Item Schema & Model
// ==========================================
const OrderItemSchema = new mongoose.Schema({
  id: { type: String },
  order_id: { type: String },
  product_id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  customization: { type: String },
  image_emoji: { type: String },
  total_price: { type: Number }
}, { timestamps: true });

// ==========================================
// 5. Order Schema & Model
// ==========================================
const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  user: { type: String },
  customer_name: { type: String, required: true },
  customer_phone: { type: String },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  coupon_code: { type: String },
  coupon: { type: String },
  total_amount: { type: Number, required: true },
  total: { type: Number },
  payment_method: { type: String, default: 'UPI' },
  payment_status: { type: String, default: 'Paid (Simulated)' },
  order_status: { 
    type: String, 
    enum: [
      'Placed', 'Order Placed', 'Confirmed', 'Preparing', 'Ready', 'Ready for Pickup', 'Completed', 'Cancelled', 'Pending',
      'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'
    ],
    default: 'Order Placed',
    set: v => {
      if (!v) return 'Order Placed';
      const clean = v.trim();
      const lower = clean.toLowerCase();
      if (lower === 'order placed' || lower === 'placed') return 'Order Placed';
      if (lower === 'ready for pickup' || lower === 'ready') return 'Ready for Pickup';
      const upper = clean.toUpperCase();
      if (['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED', 'PLACED'].includes(upper)) {
        return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
      }
      return clean;
    }
  },
  estimated_prep_time: { type: String, default: '~8–12 mins' },
  pickup_slot: { type: String, required: true },
  pickup_counter: { type: Number, default: 1 },
  loyalty_points_earned: { type: Number, default: 0 }
}, { timestamps: true });

// ==========================================
// 6. Coupon Schema & Model
// ==========================================
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

// ==========================================
// 7. Review Schema & Model
// ==========================================
const ReviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  order_id: { type: String, required: true },
  user_id: { type: String },
  user_name: { type: String, required: true },
  user_avatar: { type: String },
  product_id: { type: String },
  product_name: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  food_quality: { type: Number, default: 5 },
  service_speed: { type: Number, default: 5 },
  app_experience: { type: Number, default: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

// ==========================================
// 8. Loyalty Transaction Schema & Model
// ==========================================
const LoyaltyTransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  points: { type: Number, required: true },
  type: { type: String, enum: ['earned', 'redeemed', 'EARNED', 'REDEEMED'], default: 'earned' },
  description: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// ==========================================
// 9. Notification Schema & Model
// ==========================================
const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'SYSTEM' },
  target: { type: String, default: 'all' },
  userId: { type: String },
  icon: { type: String, default: '' },
  read: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// ==========================================
// 10. Demand Prediction Schema & Model
// ==========================================
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
const Category = mongoose.model('Category', CategorySchema);
const Product = mongoose.model('Product', ProductSchema);
const OrderItem = mongoose.model('OrderItem', OrderItemSchema);
const Order = mongoose.model('Order', OrderSchema);
const Coupon = mongoose.model('Coupon', CouponSchema);
const Review = mongoose.model('Review', ReviewSchema);
const LoyaltyTransaction = mongoose.model('LoyaltyTransaction', LoyaltyTransactionSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
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
      // 1. Categories
      const categoryCount = await Category.countDocuments();
      if (categoryCount === 0 && seedData.categories) {
        console.log(` [MongoDB] Seeding initial categories collection...`);
        await Category.insertMany(seedData.categories);
      }

      // 2. Products
      const productCount = await Product.countDocuments();
      if (productCount === 0 && seedData.products) {
        console.log(` [MongoDB] Seeding initial products collection...`);
        await Product.insertMany(seedData.products);
      }

      // 3. Users
      const userCount = await User.countDocuments();
      if (userCount === 0 && seedData.users) {
        console.log(` [MongoDB] Seeding initial users collection...`);
        await User.insertMany(seedData.users);
      }

      // 4. Orders & Order Items
      const orderCount = await Order.countDocuments();
      if (orderCount === 0 && seedData.orders) {
        console.log(` [MongoDB] Seeding initial orders collection...`);
        await Order.insertMany(seedData.orders);

        const orderItemCount = await OrderItem.countDocuments();
        if (orderItemCount === 0) {
          const itemsToInsert = [];
          seedData.orders.forEach(order => {
            (order.items || []).forEach(item => {
              itemsToInsert.push({
                id: 'oi-' + Math.random().toString(36).substring(2, 9),
                order_id: order.id,
                product_id: item.product_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                customization: item.customization,
                image_emoji: item.image_emoji,
                total_price: item.price * item.quantity
              });
            });
          });
          if (itemsToInsert.length) {
            await OrderItem.insertMany(itemsToInsert);
          }
        }
      }

      // 5. Coupons
      const couponCount = await Coupon.countDocuments();
      if (couponCount === 0 && seedData.coupons) {
        console.log(` [MongoDB] Seeding initial coupons collection...`);
        await Coupon.insertMany(seedData.coupons);
      }

      // 6. Reviews
      const reviewCount = await Review.countDocuments();
      if (reviewCount === 0 && seedData.reviews) {
        console.log(` [MongoDB] Seeding initial reviews collection...`);
        await Review.insertMany(seedData.reviews);
      }

      // 7. Loyalty Transactions
      const loyaltyCount = await LoyaltyTransaction.countDocuments();
      if (loyaltyCount === 0 && seedData.loyalty_transactions) {
        console.log(` [MongoDB] Seeding initial loyalty_transactions collection...`);
        await LoyaltyTransaction.insertMany(seedData.loyalty_transactions);
      }

      // 8. Notifications
      const notifCount = await Notification.countDocuments();
      if (notifCount === 0 && seedData.notifications) {
        console.log(` [MongoDB] Seeding initial notifications collection...`);
        await Notification.insertMany(seedData.notifications);
      }

      console.log(` [MongoDB] Database synchronized and populated!`);
    } catch (e) {
      console.error(`Error during MongoDB seeding:`, e);
    }
  }

  // Model accessors
  models() {
    return {
      User,
      Category,
      Product,
      OrderItem,
      Order,
      Coupon,
      Review,
      LoyaltyTransaction,
      Notification,
      DemandPrediction
    };
  }
}

const mongoManager = new MongoManager();

module.exports = {
  mongoManager,
  User,
  Category,
  Product,
  OrderItem,
  Order,
  Coupon,
  Review,
  LoyaltyTransaction,
  Notification,
  DemandPrediction
};
