/**
 * CampusBite Data Store
 * In-memory relational data store with JSON persistence for seamless demonstration and testing.
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'campusbite_store.json');

const INITIAL_DATA = {
  users: [
    {
      id: "u-101",
      name: "Jaswant Karun",
      email: "jaswant@campus.edu",
      alternate_email: "24cb023@kpriet.ac.in",
      phone: "87541 59344",
      role: "student",
      studentId: "CB-2024-2028",
      department: "Computer Science & Business Systems",
      loyalty_points: 420,
      wallet_balance: 850,
      avatar: "JK",
      profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80",
      account_status: "Active Verified Student",
      joined_date: "2024-08-16"
    },
    {
      id: "u-102",
      name: "Dr. Priya Sundaram",
      email: "priya.sundaram@campus.edu",
      phone: "98401 22334",
      role: "faculty",
      studentId: "FAC-8821",
      department: "School of Management & Business",
      loyalty_points: 890,
      wallet_balance: 1450,
      avatar: "PS"
    },
    {
      id: "u-103",
      name: "Karthik Raman",
      email: "karthik.raman@campus.edu",
      phone: "97911 55667",
      role: "staff",
      studentId: "STF-4402",
      department: "Central Library & Lab Administration",
      loyalty_points: 180,
      wallet_balance: 320,
      avatar: "KR"
    },
    {
      id: "u-admin",
      name: "Ramesh Canteen Manager",
      email: "admin@campusbite.com",
      phone: "+91 98765 00000",
      role: "admin",
      studentId: "ADM-001",
      department: "Campus Hospitality & Dining",
      loyalty_points: 2500,
      wallet_balance: 5000,
      avatar: "RC"
    },
    {
      id: "u-staff",
      name: "Chef Raju",
      email: "kitchen@campusbite.com",
      phone: "+91 98765 99999",
      role: "staff",
      avatar: "KS"
    }
  ],
  products: [
    {
      id: "p-1",
      name: "Classic Burger",
      description: "Crispy patty, fresh lettuce, sliced tomatoes, house sauce in a toasted sesame bun.",
      price: 80,
      category: "Snacks",
      image_emoji: "CB",
      stock: 24,
      is_available: true,
      rating: 4.8,
      prep_time: "8 mins",
      is_veg: false,
      popular: true,
      calories: "380 kcal"
    },
    {
      id: "p-2",
      name: "Cheese Burger Deluxe",
      description: "Double melted cheddar, grilled patty, caramelised onions & tangy pickle relish.",
      price: 100,
      category: "Snacks",
      image_emoji: "CB",
      stock: 18,
      is_available: true,
      rating: 4.9,
      prep_time: "10 mins",
      is_veg: false,
      popular: true,
      calories: "450 kcal"
    },
    {
      id: "p-3",
      name: "Veg Grilled Sandwich",
      description: "Crispy grilled bread layered with cucumber, capsicum, mint chutney and spiced cheese.",
      price: 60,
      category: "Snacks",
      image_emoji: "VS",
      stock: 8,
      is_available: true,
      rating: 4.6,
      prep_time: "6 mins",
      is_veg: true,
      popular: true,
      calories: "280 kcal"
    },
    {
      id: "p-4",
      name: "Paneer Tikka Roll",
      description: "Char-grilled spicy paneer cubes rolled in flaky paratha with crunchy onion salad.",
      price: 90,
      category: "Snacks",
      image_emoji: "PR",
      stock: 15,
      is_available: true,
      rating: 4.7,
      prep_time: "9 mins",
      is_veg: true,
      popular: false,
      calories: "340 kcal"
    },
    {
      id: "p-5",
      name: "Fresh Lemon Juice",
      description: "Chilled zesty lemonade with black salt and fresh mint leaves. Instant refresher!",
      price: 40,
      category: "Drinks",
      image_emoji: "LM",
      stock: 2,
      is_available: true,
      rating: 4.5,
      prep_time: "3 mins",
      is_veg: true,
      popular: true,
      calories: "90 kcal"
    },
    {
      id: "p-6",
      name: "Cold Coffee with Ice Cream",
      description: "Rich blended espresso, velvety chilled milk topped with a vanilla bean scoop.",
      price: 70,
      category: "Drinks",
      image_emoji: "CC",
      stock: 40,
      is_available: true,
      rating: 4.9,
      prep_time: "4 mins",
      is_veg: true,
      popular: true,
      calories: "260 kcal"
    },
    {
      id: "p-7",
      name: "Special Masala Chai",
      description: "Aromatic campus kadak chai brewed with crushed ginger, cardamom and clove.",
      price: 20,
      category: "Drinks",
      image_emoji: "MS",
      stock: 65,
      is_available: true,
      rating: 4.7,
      prep_time: "2 mins",
      is_veg: true,
      popular: true,
      calories: "75 kcal"
    },
    {
      id: "p-8",
      name: "South Indian Special Thali",
      description: "Steamed Basmati Rice, Sambar, Rasam, 2 Poriyals, Appalam, Curd & Sweet.",
      price: 110,
      category: "Meals",
      image_emoji: "BM",
      stock: 25,
      is_available: true,
      rating: 4.8,
      prep_time: "5 mins",
      is_veg: true,
      popular: true,
      calories: "620 kcal"
    },
    {
      id: "p-9",
      name: "Hyderabadi Chicken Biryani",
      description: "Dum-cooked fragrant basmati rice with marinated chicken pieces and rich spices.",
      price: 140,
      category: "Meals",
      image_emoji: "BC",
      stock: 30,
      is_available: true,
      rating: 4.9,
      prep_time: "5 mins",
      is_veg: false,
      popular: true,
      calories: "680 kcal"
    },
    {
      id: "p-10",
      name: "Veg Hakka Noodles & Manchurian",
      description: "Wok-tossed stir fry noodles paired with savory vegetable Manchurian gravy.",
      price: 120,
      category: "Meals",
      image_emoji: "MN",
      stock: 16,
      is_available: true,
      rating: 4.6,
      prep_time: "8 mins",
      is_veg: true,
      popular: false,
      calories: "510 kcal"
    },
    {
      id: "p-11",
      name: "Warm Choco Lava Cake",
      description: "Molten dark chocolate center that oozes with pure cocoa bliss.",
      price: 65,
      category: "Desserts",
      image_emoji: "CL",
      stock: 14,
      is_available: true,
      rating: 4.9,
      prep_time: "4 mins",
      is_veg: true,
      popular: true,
      calories: "320 kcal"
    },
    {
      id: "p-12",
      name: "Hot Gulab Jamun (2 Pcs)",
      description: "Golden fried khoya dumplings soaked in saffron rose cardamom sugar syrup.",
      price: 45,
      category: "Desserts",
      image_emoji: "BR",
      stock: 22,
      is_available: true,
      rating: 4.7,
      prep_time: "2 mins",
      is_veg: true,
      popular: false,
      calories: "290 kcal"
    },
    {
      id: "p-17",
      name: "Seasonal Alphonso Mango Lassi",
      description: "Thick creamy chilled mango lassi infused with green cardamom and saffron. (Seasonal Special - Sold Out)",
      price: 60,
      category: "Drinks",
      image_emoji: "🥭",
      stock: 0,
      is_available: false,
      rating: 4.9,
      prep_time: "3 mins",
      is_veg: true,
      popular: false,
      calories: "220 kcal"
    }
  ],
  coupons: [
    {
      id: "c-1",
      code: "CAMPUS20",
      description: "20% OFF on Canteen Combo & Meals",
      discount_type: "percentage",
      discount_value: 20,
      minimum_order: 100,
      max_discount: 50,
      expiry_date: "2026-12-31",
      is_active: true,
      badge: "Today's Best Offer"
    },
    {
      id: "c-2",
      code: "STUDENT10",
      description: "10% Student special discount on any order",
      discount_type: "percentage",
      discount_value: 10,
      minimum_order: 50,
      max_discount: 30,
      expiry_date: "2026-12-31",
      is_active: true,
      badge: "⭐ Everyday Saver"
    },
    {
      id: "c-3",
      code: "EXAMSNACK",
      description: "Flat ₹25 OFF during study break hours",
      discount_type: "flat",
      discount_value: 25,
      minimum_order: 150,
      max_discount: 25,
      expiry_date: "2026-11-30",
      is_active: true,
      badge: "Study Hours"
    },
    {
      id: "c-4",
      code: "SPIN20",
      description: "Flat ₹20 OFF Campus Wheel Reward",
      discount_type: "flat",
      discount_value: 20,
      minimum_order: 40,
      max_discount: 20,
      expiry_date: "2026-12-31",
      is_active: true,
      badge: "Spin Winner"
    },
    {
      id: "c-5",
      code: "CHEESE",
      description: "Free Extra Cheese Upgrade Voucher",
      discount_type: "flat",
      discount_value: 15,
      minimum_order: 30,
      max_discount: 15,
      expiry_date: "2026-12-31",
      is_active: true,
      badge: "Wheel Perk"
    },
    {
      id: "c-6",
      code: "FREECHAI",
      description: "Free Kadak Chai with Snack",
      discount_type: "flat",
      discount_value: 15,
      minimum_order: 30,
      max_discount: 15,
      expiry_date: "2026-12-31",
      is_active: true,
      badge: "Wheel Perk"
    },
    {
      id: "c-7",
      code: "BENTO30",
      description: "₹30 OFF Mystery Bento Box",
      discount_type: "flat",
      discount_value: 30,
      minimum_order: 70,
      max_discount: 30,
      expiry_date: "2026-12-31",
      is_active: true,
      badge: "Mystery Drop"
    },
    {
      id: "c-8",
      code: "SNACK15",
      description: "15% OFF on Sandwiches & Rolls",
      discount_type: "percentage",
      discount_value: 15,
      minimum_order: 40,
      max_discount: 35,
      expiry_date: "2026-12-31",
      is_active: true,
      badge: "Wheel Perk"
    },
    {
      id: "c-9",
      code: "EXPIRED50",
      description: "50% Flash Clearance (Expired Voucher)",
      discount_type: "percentage",
      discount_value: 50,
      minimum_order: 50,
      max_discount: 100,
      expiry_date: "2023-01-01",
      is_active: true,
      badge: "Expired Test"
    },
    {
      id: "c-10",
      code: "INACTIVE15",
      description: "15% Paused Promotional Campaign",
      discount_type: "percentage",
      discount_value: 15,
      minimum_order: 50,
      max_discount: 50,
      expiry_date: "2026-12-31",
      is_active: false,
      badge: "Deactivated"
    },
    {
      id: "c-11",
      code: "BIGBITE200",
      description: "Flat ₹50 OFF on orders above ₹200",
      discount_type: "flat",
      discount_value: 50,
      minimum_order: 200,
      max_discount: 50,
      expiry_date: "2026-12-31",
      is_active: true,
      badge: "Min Order Test"
    }
  ],
  orders: [
    {
      id: "CB1024",
      user_id: "u-101",
      customer_name: "Jaswant Karun",
      customer_phone: "87541 59344",
      items: [
        { product_id: "p-1", name: "Classic Burger", price: 80, quantity: 2 },
        { product_id: "p-5", name: "Fresh Lemon Juice", price: 40, quantity: 1 }
      ],
      subtotal: 200,
      discount: 20,
      coupon_code: "CAMPUS20",
      total_amount: 180,
      payment_method: "UPI",
      payment_status: "Paid (Simulated UPI)",
      order_status: "Ready",
      estimated_prep_time: "0 mins (Ready for Pickup)",
      pickup_slot: "12:30 PM - 12:40 PM",
      pickup_counter: 2,
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60000).toISOString(),
      loyalty_points_earned: 18
    },
    {
      id: "CB1025",
      user_id: "u-102",
      customer_name: "Ananya Sharma",
      customer_phone: "+91 98765 12345",
      items: [
        { product_id: "p-3", name: "Veg Grilled Sandwich", price: 60, quantity: 1 },
        { product_id: "p-5", name: "Fresh Lemon Juice", price: 40, quantity: 2 }
      ],
      subtotal: 140,
      discount: 0,
      coupon_code: null,
      total_amount: 140,
      payment_method: "UPI",
      payment_status: "Paid (Simulated UPI)",
      order_status: "Preparing",
      estimated_prep_time: "~4–6 mins (In Kitchen Prep)",
      pickup_slot: "12:40 PM - 12:50 PM",
      pickup_counter: 1,
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
      loyalty_points_earned: 14
    },
    {
      id: "CB1026",
      user_id: "u-101",
      customer_name: "Jaswant Karun",
      customer_phone: "87541 59344",
      items: [
        { product_id: "p-8", name: "South Indian Special Thali", price: 110, quantity: 2 }
      ],
      subtotal: 220,
      discount: 0,
      coupon_code: null,
      total_amount: 220,
      payment_method: "Card",
      payment_status: "Paid",
      order_status: "Confirmed",
      estimated_prep_time: "~8–10 mins",
      pickup_slot: "01:00 PM - 01:15 PM",
      pickup_counter: 3,
      created_at: new Date(Date.now() - 35 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 20 * 60000).toISOString(),
      loyalty_points_earned: 22
    },
    {
      id: "CB1020",
      user_id: "u-101",
      customer_name: "Jaswant Karun",
      customer_phone: "87541 59344",
      items: [
        { product_id: "p-2", name: "Cheese Burger Deluxe", price: 100, quantity: 1 },
        { product_id: "p-6", name: "Cold Coffee with Ice Cream", price: 70, quantity: 1 }
      ],
      subtotal: 170,
      discount: 17,
      coupon_code: "STUDENT10",
      total_amount: 153,
      payment_method: "UPI",
      payment_status: "Paid",
      order_status: "Completed",
      estimated_prep_time: "Fulfilled",
      pickup_slot: "11:15 AM - 11:25 AM",
      pickup_counter: 2,
      created_at: new Date(Date.now() - 120 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 95 * 60000).toISOString(),
      loyalty_points_earned: 15
    }
  ],
  reviews: [
    {
      id: "r-1",
      order_id: "CB1020",
      user_name: "Jaswant Karun",
      rating: 5,
      food_quality: 5,
      service_speed: 5,
      app_experience: 5,
      comment: "Saved me 20 minutes before my Operating Systems lecture! The burger was hot and ready at Counter 2.",
      created_at: new Date(Date.now() - 90 * 60000).toISOString()
    },
    {
      id: "r-2",
      order_id: "CB1018",
      user_name: "Kavya Menon",
      rating: 4,
      food_quality: 4,
      service_speed: 5,
      app_experience: 4,
      comment: "Super convenient pickup slots. Cold coffee was fantastic!",
      created_at: new Date(Date.now() - 180 * 60000).toISOString()
    },
    {
      id: "r-3",
      order_id: "CB1015",
      user_name: "Rahul Verma",
      rating: 5,
      food_quality: 5,
      service_speed: 4,
      app_experience: 5,
      comment: "The UPI simulation and loyalty points make this feel like Zomato built for our college.",
      created_at: new Date(Date.now() - 240 * 60000).toISOString()
    }
  ],
  loyalty_transactions: [
    {
      id: "lt-0",
      user_id: "u-101",
      points: 437,
      type: "earned",
      description: "Welcome Bonus & Campus Orientation Dining Credits",
      date: new Date(Date.now() - 7 * 86400000).toISOString()
    },
    {
      id: "lt-1",
      user_id: "u-101",
      points: 15,
      type: "earned",
      description: "Order #CB1020 reward (10% back)",
      date: new Date(Date.now() - 120 * 60000).toISOString()
    },
    {
      id: "lt-2",
      user_id: "u-101",
      points: 18,
      type: "earned",
      description: "Order #CB1024 reward",
      date: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
      id: "lt-3",
      user_id: "u-101",
      points: -50,
      type: "redeemed",
      description: "Redeemed for ₹10 off coupon on last week's order",
      date: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  categories: [
    { id: "cat-1", name: "Snacks", slug: "snacks", icon: "🥪", description: "Quick bites, burgers, sandwiches & rolls", sort_order: 1 },
    { id: "cat-2", name: "Drinks", slug: "drinks", icon: "🥤", description: "Hot filter coffee, chai & fresh juices", sort_order: 2 },
    { id: "cat-3", name: "Meals", slug: "meals", icon: "🍛", description: "Nutritious lunch platters & South Indian thalis", sort_order: 3 },
    { id: "cat-4", name: "Healthy", slug: "healthy", icon: "🥗", description: "High-protein salads & low-cal snacks", sort_order: 4 },
    { id: "cat-5", name: "Desserts", slug: "desserts", icon: "🍨", description: "Gulab jamun & dessert treats", sort_order: 5 }
  ],
  notifications: [
    {
      id: "notif-seed-1",
      title: "Order Confirmed: #CB1024",
      message: "Your order #CB1024 has been confirmed by kitchen staff. Preparation queued.",
      type: "ORDER_CONFIRMED",
      target: "student",
      userId: "u-101",
      icon: "CONFIRMED",
      read: false,
      created_at: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
      id: "notif-seed-2",
      title: "Order Being Prepared: #CB1025",
      message: "Kitchen is actively preparing your order #CB1025 at Counter 2.",
      type: "ORDER_PREPARING",
      target: "student",
      userId: "u-101",
      icon: "PREPARING",
      read: false,
      created_at: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
      id: "notif-seed-3",
      title: "Order Ready for Pickup: #CB1020",
      message: "Your order #CB1020 is READY for pickup at Counter 1! Please show token #CB1020.",
      type: "ORDER_READY",
      target: "student",
      userId: "u-101",
      icon: "READY",
      read: false,
      created_at: new Date(Date.now() - 45 * 60000).toISOString()
    },
    {
      id: "notif-seed-4",
      title: "Order Completed: #CB1018",
      message: "Your order #CB1018 has been picked up. Thank you for dining with CampusBite!",
      type: "ORDER_COMPLETED",
      target: "student",
      userId: "u-101",
      icon: "COMPLETED",
      read: true,
      created_at: new Date(Date.now() - 180 * 60000).toISOString()
    },
    {
      id: "notif-seed-5",
      title: "Coupon Available: CAMPUS20",
      message: "Special 20% discount offer is available on campus orders! Use promo code CAMPUS20.",
      type: "COUPON_AVAILABLE",
      target: "student",
      userId: "u-101",
      icon: "COUPON",
      read: false,
      created_at: new Date(Date.now() - 360 * 60000).toISOString()
    },
    {
      id: "notif-seed-6",
      title: "Welcome to CampusBite",
      message: "Order online to skip long counter queues. Express Counter 1 & 2 are open.",
      type: "SYSTEM",
      target: "all",
      userId: null,
      icon: "SYSTEM",
      read: true,
      created_at: new Date(Date.now() - 720 * 60000).toISOString()
    }
  ],
  analytics: {
    today_revenue: 12450,
    today_orders: 186,
    total_customers: 142,
    pending_orders: 23,
    avg_rating: 4.5,
    ratings_breakdown: {
      food_quality: 4.6,
      service: 4.3,
      app_experience: 4.5
    },
    top_selling: [
      { name: "Burger", sales_count: 75, revenue: 6300 },
      { name: "Sandwich", sales_count: 62, revenue: 3720 },
      { name: "Lemon Juice", sales_count: 51, revenue: 2040 },
      { name: "Coffee", sales_count: 38, revenue: 2660 }
    ],
    weekly_revenue: [
      { day: "Mon", revenue: 8400, orders: 120 },
      { day: "Tue", revenue: 10200, orders: 154 },
      { day: "Wed", revenue: 7800, orders: 110 },
      { day: "Thu", revenue: 11900, orders: 175 },
      { day: "Fri", revenue: 13800, orders: 205 },
      { day: "Sat", revenue: 6500, orders: 90 },
      { day: "Sun", revenue: 2200, orders: 35 }
    ],
    orders_by_hour: [
      { hour: "9 AM", orders: 14, label: "Breakfast Rush" },
      { hour: "10 AM", orders: 22, label: "Morning Tea" },
      { hour: "11 AM", orders: 38, label: "Pre-lunch Snack" },
      { hour: "12 PM", orders: 84, label: "Peak Lunch Hour 1" },
      { hour: "1 PM", orders: 96, label: "Peak Lunch Hour 2" },
      { hour: "2 PM", orders: 42, label: "Post-lunch Refreshment" },
      { hour: "3 PM", orders: 28, label: "Evening Snacks" }
    ]
  },
  coupons: [
    {
      id: "c-101",
      code: "CAMPUS20",
      description: "20% OFF on campus orders up to ₹50",
      discount_type: "percentage",
      discount_value: 20,
      minimum_order: 100,
      max_discount: 50,
      expiry_date: "2026-12-31",
      is_active: true,
      badge: "Student Favorite"
    },
    {
      id: "c-102",
      code: "WELCOME10",
      description: "10% OFF your meals across campus",
      discount_type: "percentage",
      discount_value: 10,
      minimum_order: 50,
      max_discount: 30,
      expiry_date: "2026-12-31",
      is_active: true,
      badge: "Welcome Deal"
    },
    {
      id: "c-103",
      code: "BIGBITE200",
      description: "Flat ₹50 OFF on orders of ₹200 or more",
      discount_type: "flat",
      discount_value: 50,
      minimum_order: 200,
      max_discount: 50,
      expiry_date: "2026-12-31",
      is_active: true,
      badge: "Hunger Buster"
    },
    {
      id: "c-104",
      code: "EXPIRED50",
      description: "50% OFF flash voucher (Expired)",
      discount_type: "percentage",
      discount_value: 50,
      minimum_order: 100,
      max_discount: 100,
      expiry_date: "2023-01-01",
      is_active: true,
      badge: "Expired Voucher"
    },
    {
      id: "c-105",
      code: "INACTIVE15",
      description: "15% OFF discontinued promotion",
      discount_type: "percentage",
      discount_value: 15,
      minimum_order: 50,
      max_discount: 40,
      expiry_date: "2026-12-31",
      is_active: false,
      badge: "Disabled Promo"
    }
  ]
};

class Database {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        let updated = false;
        if (!parsed.categories) {
          parsed.categories = INITIAL_DATA.categories;
          updated = true;
        }
        if (!parsed.notifications || !parsed.notifications.length) {
          parsed.notifications = INITIAL_DATA.notifications;
          updated = true;
        } else {
          INITIAL_DATA.notifications.forEach(seed => {
            const existing = parsed.notifications.find(n => n.id === seed.id || (n.type === seed.type && n.title === seed.title));
            if (!existing) {
              parsed.notifications.push(seed);
              updated = true;
            }
          });
        }
        if (!parsed.coupons || !parsed.coupons.length) {
          parsed.coupons = INITIAL_DATA.coupons;
          updated = true;
        } else {
          INITIAL_DATA.coupons.forEach(seed => {
            const existing = parsed.coupons.find(c => c.code.toUpperCase() === seed.code.toUpperCase());
            if (!existing) {
              parsed.coupons.push(seed);
              updated = true;
            } else {
              if (seed.code === 'EXPIRED50') {
                existing.expiry_date = seed.expiry_date;
                updated = true;
              }
              if (seed.code === 'INACTIVE15') {
                existing.is_active = false;
                updated = true;
              }
              if (seed.code === 'BIGBITE200') {
                existing.minimum_order = 200;
                updated = true;
              }
            }
          });
        }
        if (!parsed.loyalty_transactions || !parsed.loyalty_transactions.length) {
          parsed.loyalty_transactions = INITIAL_DATA.loyalty_transactions;
          updated = true;
        } else {
          INITIAL_DATA.loyalty_transactions.forEach(seed => {
            const existing = parsed.loyalty_transactions.find(lt => lt.id === seed.id);
            if (!existing) {
              parsed.loyalty_transactions.push(seed);
              updated = true;
            }
          });
        }
        if (parsed.users) {
          const u101 = parsed.users.find(u => u.id === 'u-101');
          if (u101) {
            if (!u101.profile_image) {
              u101.profile_image = INITIAL_DATA.users[0].profile_image;
              updated = true;
            }
            if (!u101.account_status) {
              u101.account_status = 'Active Verified Student';
              updated = true;
            }
            if (!u101.joined_date) {
              u101.joined_date = '2024-08-16';
              updated = true;
            }
          }
        }
        if (updated) this.saveData(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn("Could not load from DB_FILE, fallback to initial data", e);
    }
    this.saveData(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  saveData(data = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error("Error saving DB_FILE:", e);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveData();
    return this.data;
  }
}

const dbInstance = new Database();
module.exports = dbInstance;
