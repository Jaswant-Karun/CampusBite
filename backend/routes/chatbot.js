/**
 * CampusBite AI Dining Assistant - Chatbot API Route
 * Handles conversational queries for both Desktop Website & Mobile App
 */

const express = require('express');
const router = express.Router();
const db = require('../data/db');

router.post('/', (req, res) => {
  try {
    const { message = '', userContext = {} } = req.body;
    const q = message.trim().toLowerCase();
    const products = db.data.products || [];
    const orders = db.data.orders || [];
    const coupons = db.data.coupons || [];

    // Default response structure
    let reply = "";
    let items = [];
    let quickReplies = ["🍔 Popular Today", "🟢 Pure Veg Only", "📍 Track My Order", "🎟️ Coupons & Offers", "⭐ My Loyalty Points"];
    let action = null;

    if (!q) {
      return res.json({
        success: true,
        reply: "Hi there! 👋 I'm **BiteBot**, your Campus Dining Assistant. How can I satisfy your cravings or help with your order today?",
        quickReplies,
        items: []
      });
    }

    // 1. GREETING
    if (/^(hi|hello|hey|hola|namaste|vanakkam|sup|yo|start|good (morning|afternoon|evening))\b/i.test(q)) {
      reply = `Hello ${userContext.name ? userContext.name.split(' ')[0] : 'there'}! 👋 Welcome to **CampusBite**. I'm here to help you discover tasty meals, avoid long counter lines, track your live food prep, and redeem loyalty rewards. What would you like to explore?`;
      quickReplies = ["🍔 Today's Bestsellers", "⚡ Quick Bites (<10 mins)", "📍 Where's my order?", "💰 Wallet Balance"];
    }

    // 2. ORDER TRACKING
    else if (q.includes('track') || q.includes('status') || q.includes('where is my order') || q.includes('token') || q.includes('cb1024') || q.includes('order')) {
      const activeOrder = orders.find(o => (o.order_status || o.status || '').toLowerCase() !== 'completed') || orders[0];
      if (activeOrder) {
        const orderStatus = (activeOrder.order_status || activeOrder.status || 'Placed').toUpperCase();
        const counterNum = activeOrder.pickup_counter || activeOrder.counter || 2;
        const totalCost = activeOrder.total_amount || activeOrder.total || 96;
        const itemsList = (activeOrder.items || []).map(i => `${i.name} (×${i.quantity})`).join(', ') || 'Campus Meal';
        reply = `📦 **Order Tracking (#${activeOrder.id})**:\n- **Status**: ${orderStatus} 🚀\n- **Pickup Counter**: Counter ${counterNum}\n- **Estimated Slot**: ${activeOrder.pickup_slot || '12:30 PM - 12:40 PM'}\n- **Items**: ${itemsList}\n- **Total**: ₹${totalCost}`;
        action = { type: "navigate", target: "tracking", orderId: activeOrder.id };
        quickReplies = ["View Live Radar", "Order Something Else", "Call Helpdesk"];
      } else {
        reply = "You don't have an active in-kitchen order right now. Ready to grab a fresh bite?";
        quickReplies = ["Browse Menu", "Today's Specials", "Check Cart"];
      }
    }

    // 3. LOYALTY & REWARDS
    else if (q.includes('point') || q.includes('loyalty') || q.includes('reward') || q.includes('coin') || q.includes('cashback') || q.includes('voucher') || q.includes('redeem')) {
      const points = userContext.loyalty_points || 420;
      const discountVal = Math.floor(points / 10);
      reply = `⭐ **Campus Loyalty CRM**:\nYou currently have **${points} Loyalty Points** (worth **₹${discountVal} OFF** on your orders)!\n\n💡 *Perks*:\n- 10% instant points cashback on every order\n- 100 points = ₹10 off voucher\n- Gold Member priority counter privileges`;
      action = { type: "openModal", modal: "rewardsStore" };
      quickReplies = ["Open Voucher Store", "Redeem in Cart", "How to earn more?"];
    }

    // 4. COUPONS & PROMOS
    else if (q.includes('coupon') || q.includes('promo') || q.includes('offer') || q.includes('discount') || q.includes('deal') || q.includes('code')) {
      reply = `🎟️ **Active Campus Canteen Coupons**:\n1. **CAMPUS20**: 20% OFF on all Combo Meals (min ₹100)\n2. **FIRST50**: 50% OFF up to ₹75 on first pre-order\n3. **EXPRESS10**: ₹10 Flat Off on Express Pickup Slot ⚡\n\nTap below to copy or apply directly at checkout!`;
      action = { type: "applyCoupon", code: "CAMPUS20" };
      quickReplies = ["Apply CAMPUS20", "View Menu", "Under ₹80"];
    }

    // 5. CANTEEN TIMINGS & CROWD STATUS
    else if (q.includes('time') || q.includes('timing') || q.includes('hour') || q.includes('open') || q.includes('close') || q.includes('crowd') || q.includes('rush') || q.includes('wait') || q.includes('queue')) {
      reply = `⏰ **Campus Canteen Timings & Live Crowd Radar**:\n- **Hours**: 7:30 AM – 9:30 PM (Mon–Sat)\n- **Current Occupancy**: **Moderate (62% Full)**\n- **Average Wait**: **6 to 8 minutes**\n- **Counter 1**: Snacks & Rolls (3m wait)\n- **Counter 2**: Rice Bowls & Thalis (8m wait)\n- **Counter 3**: Hot & Cold Beverages (2m wait)\n\nPre-ordering on CampusBite guarantees zero wait time at your chosen slot!`;
      quickReplies = ["🍔 Order Now", "⚡ Fast Prep Items", "📍 Live Order Tracking"];
    }

    // 6. WALLET & PAYMENTS
    else if (q.includes('wallet') || q.includes('balance') || q.includes('campuspay') || q.includes('upi') || q.includes('payment') || q.includes('money') || q.includes('refund')) {
      const balance = userContext.wallet_balance || 850;
      reply = `💳 **CampusPay Digital Wallet**:\n- Current Balance: **₹${balance}.00**\n- Instant 1-tap checkout enabled.\n- Zero-failed UPI simulation.\n- Auto-refund in < 5 seconds if an order is cancelled.`;
      action = { type: "navigate", target: "wallet" };
      quickReplies = ["Add Funds", "Place Order with Wallet", "Back to Menu"];
    }

    // 7. SPECIFIC ITEM OR CATEGORY SEARCH
    else if (q.includes('burger') || q.includes('sandwich') || q.includes('coffee') || q.includes('tea') || q.includes('juice') || q.includes('biryani') || q.includes('thali') || q.includes('samosa') || q.includes('dosa') || q.includes('roll') || q.includes('paneer') || q.includes('pizza') || q.includes('maggi') || q.includes('noodle')) {
      const keyword = q.match(/(burger|sandwich|coffee|tea|juice|biryani|thali|samosa|dosa|roll|paneer|pizza|maggi|noodle)/i)?.[0]?.toLowerCase() || '';
      items = products.filter(p => p.name.toLowerCase().includes(keyword) || p.description.toLowerCase().includes(keyword)).slice(0, 3);
      if (items.length > 0) {
        reply = `Here are the freshest **${keyword}** options prepared at our campus kitchen:`;
      } else {
        items = products.slice(0, 3);
        reply = `I couldn't find an exact match for "${keyword}", but check out these popular student favorites:`;
      }
      quickReplies = ["Under ₹60", "Pure Veg", "View Full Menu"];
    }

    // 8. VEG / DIETARY FILTER
    else if (q.includes('veg') || q.includes('vegetarian') || q.includes('pure veg') || q.includes('jain') || q.includes('healthy')) {
      items = products.filter(p => p.is_veg).slice(0, 3);
      reply = `🌱 Here are top rated **100% Pure Veg** dishes prepared in our dedicated green-certified kitchen:`;
      action = { type: "filter", filter: "veg" };
      quickReplies = ["Under ₹70", "Meals & Thalis", "Beverages"];
    }

    // 9. QUICK / FAST PREP (< 10 MINS)
    else if (q.includes('fast') || q.includes('quick') || q.includes('hurry') || q.includes('10 min') || q.includes('express') || q.includes('rush')) {
      items = products.filter(p => (p.prep_time_minutes || 8) <= 8).slice(0, 3);
      reply = `⚡ In a rush between lectures? These **Super Express Items** are ready in **under 8 minutes**:`;
      action = { type: "filter", filter: "fast" };
      quickReplies = ["Beverages Only", "Quick Snacks", "Order Now"];
    }

    // 10. BUDGET / CHEAP ITEMS (UNDER ₹50 - ₹80)
    else if (q.includes('cheap') || q.includes('budget') || q.includes('low price') || q.includes('50') || q.includes('80') || q.includes('pocket')) {
      items = products.filter(p => p.price <= 70).sort((a, b) => a.price - b.price).slice(0, 3);
      reply = `💰 Pocket-friendly **Student Budget Picks (under ₹70)**:`;
      action = { type: "filter", filter: "cheap" };
      quickReplies = ["Quick Snacks", "Drinks", "Redeem 100 Pts"];
    }

    // 11. BESTSELLERS / POPULAR
    else if (q.includes('popular') || q.includes('best') || q.includes('special') || q.includes('recommend') || q.includes('what to eat') || q.includes('hungry') || q.includes('lunch') || q.includes('dinner') || q.includes('breakfast')) {
      items = products.filter(p => p.popular || p.rating >= 4.7).slice(0, 3);
      reply = `🔥 Today's highest-rated **Campus Bestsellers** with maximum student ratings:`;
      action = { type: "filter", filter: "bestseller" };
      quickReplies = ["Pure Veg Only", "Under ₹60", "Apply CAMPUS20"];
    }

    // 12. HELPDESK & FEEDBACK
    else if (q.includes('help') || q.includes('contact') || q.includes('support') || q.includes('manager') || q.includes('call') || q.includes('feedback') || q.includes('issue') || q.includes('canteen')) {
      reply = `📞 **Campus Canteen Helpdesk & Staff Contact**:\n- **Canteen Manager**: Ramesh Kumar (+91 98401 23456)\n- **Kitchen Operations**: Counter 1 & 2 Helpdesk\n- **Email**: canteen-support@campusbite.edu\n- **Location**: Student Activity Center, Ground Floor\n\nYou can also submit instant ratings and remarks via our customer feedback portal!`;
      action = { type: "openModal", modal: "feedback" };
      quickReplies = ["Submit Feedback", "View Canteen Radar", "Browse Menu"];
    }

    // 13. FALLBACK / GENERAL INTELLIGENCE
    else {
      items = products.slice(0, 2);
      reply = `I can help you with anything related to Campus Dining! For example, ask me:\n- *"Show me pure veg items under ₹80"*\n- *"Where is my order #CB1024?"*\n- *"What are the canteen timings?"*\n- *"How do I redeem my loyalty points?"*`;
      quickReplies = ["🍔 Campus Bestsellers", "⚡ Fast Prep <10m", "🎟️ Active Coupons", "⭐ My Points"];
    }

    return res.json({
      success: true,
      reply,
      items,
      quickReplies,
      action
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({
      success: false,
      reply: "Oops! My chef brain had a small hiccup. Let's try again or browse the menu directly!",
      quickReplies: ["Browse Menu", "Popular Items"],
      items: []
    });
  }
});

module.exports = router;
