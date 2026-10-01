# CampusBite — Wireframes & Navigation Architecture

This document specifies the wireframe specifications, interaction states, and user journeys across the 12 customer screens and executive admin dashboard backed by MongoDB, in compliance with the E-Business Management assignment criteria (minimum 6 wireframes required; 12 provided).

---

## 1. End-to-End System Navigation Flow

```text
[ Motion Title Splash ] ───(Kinetic "CampusBite" Animated Display)
       │
       ▼
[ Dedicated Sign In / Sign Up ] ──(Student / Staff / Admin + Campus SSO)
       │
       ▼
 [ Home Screen ] ─────────────┬──────────────┬───────────────┬────────────────┐
       │                      │              │               │                │
       ▼                      ▼              ▼               ▼                ▼
 [ Crowding Radar ]     [ CampusPay Wallet ] [ Menu Catalog ] [ Promo Banner ] [ Popular Items ]
       │                      │              │               │
       ▼                      ▼              ▼               ▼
 [ Search/Filter ]      [ Promo Banner ]  [ Category ]  [ Popular Items ]
       │                      │              │               │
       └──────────────────────┴───────┬──────┴───────────────┘
                                      │
                                      ▼
                                [ Menu Screen ]
                                      │
                                      ▼
                             [ Product Details ]
                                      │
                                      ▼
                               [ Cart Screen ]
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  [ Apply Coupon ]       [ Redeem Loyalty ]
                         └────────────┬────────────┘
                                      │
                                      ▼
                              [ Checkout Screen ]
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  [ Pickup Slot ]           [ Payment Mode ]
                         └────────────┬────────────┘
                                      │
                                      ▼
                           [ UPI Payment Simulation ]
                                      │
                                      ▼
                           [ Order Confirmation ]
                                      │
                                      ▼
                            [ Live Order Tracking ]
                         (Placed → Confirmed → Preparing
                          → Ready for Pickup → Completed)
                                      │
                                      ▼
                            [ Customer Feedback ]
```

---

## 2. Customer Wireframe Specifications

### Screen 1: Splash Screen

```text
┌──────────────────────────────────────┐
│  9:41                   5G 📶 100% 🔋│
├──────────────────────────────────────┤
│                                      │
│                  🍔                  │
│              CAMPUSBITE              │
│       Smart Campus Food Platform     │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ⏱️ Pre-Order & Skip the Queue  │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ 💳 Instant Simulated UPI       │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ ⭐ 10% Loyalty Rewards         │  │
│  └────────────────────────────────┘  │
│                                      │
│         [ GET STARTED → ]            │
└──────────────────────────────────────┘
```

### Screen 2: Login / Authentication

```text
┌──────────────────────────────────────┐
│  9:41                   5G 📶 100% 🔋│
├──────────────────────────────────────┤
│  Welcome Back! 👋                    │
│  Sign in to order campus meals       │
│                                      │
│  [ Sign In ]      [ Register ]       │
│                                      │
│  Campus Email / Phone                │
│  [ jaswant@campus.edu              ] │
│                                      │
│  Password                            │
│  [ •••••••••                       ] │
│                                      │
│  [      LOGIN TO CAMPUSBITE       ]  │
│                                      │
│  💡 Demo Account: Jaswant (420 pts)  │
│  [ Continue as Jaswant ]             │
└──────────────────────────────────────┘
```

### Screen 3: Home Screen

```text
┌──────────────────────────────────────┐
│  9:41                   5G 📶 100% 🔋│
├──────────────────────────────────────┤
│  Hi, Jaswant 👋        ⭐ 420 pts    │
│  Campus Main Canteen • Open          │
│                                      │
│  🔍 [ Search food, meals, drinks... ]│
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔥 TODAY'S OFFER               │  │
│  │ 20% OFF on Combo Meals         │  │
│  │ [ CAMPUS20 • Tap to apply ]    │  │
│  └────────────────────────────────┘  │
│                                      │
│  (All) (Snacks) (Meals) (Drinks)     │
│                                      │
│  POPULAR TODAY                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ 🍔      │ │ 🥪      │ │ 🥤      │ │
│  │ Burger  │ │ Sandwich│ │ Coffee  │ │
│  │ ₹80     │ │ ₹60     │ │ ₹70     │ │
│  │ [+ Add] │ │ [+ Add] │ │ [+ Add] │ │
│  └─────────┘ └─────────┘ └─────────┘ │
│                                      │
│  [🏠 Home] [🍔 Menu] [🛒 Cart] [👤]  │
└──────────────────────────────────────┘
```

### Screen 4: Menu Screen

```text
┌──────────────────────────────────────┐
│  9:41                   5G 📶 100% 🔋│
├──────────────────────────────────────┤
│  Canteen Menu 🍽️                     │
│  (All)  (Snacks)  (Meals)  (Drinks)  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🟢 Classic Burger      ★ 4.8   │  │
│  │ Crispy patty, fresh lettuce    │  │
│  │ ₹80                [ - 1 + ]   │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ 🟢 Veg Grilled Sandwich ★ 4.6   │  │
│  │ Spiced cheese & mint chutney   │  │
│  │ ₹60                [ + Add ]   │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ 🟢 Fresh Lemon Juice    ★ 4.5  │  │
│  │ Chilled zesty lemonade         │  │
│  │ ₹40                [ + Add ]   │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Screen 5: Cart Screen

```text
┌──────────────────────────────────────┐
│  9:41                   5G 📶 100% 🔋│
├──────────────────────────────────────┤
│  Your Cart 🛒                        │
│                                      │
│  🍔 Classic Burger (×2)      ₹160    │
│     [ - ]  2  [ + ]                  │
│  🍋 Lemon Juice (×1)         ₹40     │
│     [ - ]  1  [ + ]                  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Promo: [ CAMPUS20      ] APPLY │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ [X] Redeem 100 Pts (-₹10)      │  │
│  └────────────────────────────────┘  │
│                                      │
│  Subtotal                    ₹200    │
│  Coupon Discount (20%)       -₹20    │
│  Total Amount                ₹180    │
│                                      │
│  [ PROCEED TO CHECKOUT (₹180) → ]    │
└──────────────────────────────────────┘
```

### Screen 6: Checkout Screen

```text
┌──────────────────────────────────────┐
│  9:41                   5G 📶 100% 🔋│
├──────────────────────────────────────┤
│  Checkout & Pickup 📍                │
│                                      │
│  Pickup Slot:                        │
│  [● 12:30 PM - 12:40 PM] [12:40-12:50]│
│  [  01:00 PM - 01:15 PM] [Express 5m ]│
│                                      │
│  Payment Option:                     │
│  (●) Simulated UPI (GPay/PhonePe)     │
│  ( ) Credit / Debit Card             │
│  ( ) Pay Cash at Counter             │
│                                      │
│  Total Payable: ₹180                 │
│                                      │
│  [     PAY & PLACE ORDER →     ]     │
└──────────────────────────────────────┘
```

### Screen 7: UPI Payment Gateway Modal

```text
┌──────────────────────────────────────┐
│       Simulated UPI Gateway          │
│                                      │
│    ┌───────────────────────────┐     │
│    │       🏁 QR CODE          │     │
│    │     campusbite@upi        │     │
│    └───────────────────────────┘     │
│                                      │
│             ₹180.00                  │
│   Zero-Queue Instant Verification    │
│                                      │
│   [ ⚡ SIMULATE APPROVED PAYMENT ]    │
└──────────────────────────────────────┘
```

### Screen 8: Order Confirmation

```text
┌──────────────────────────────────────┐
│  9:41                   5G 📶 100% 🔋│
├──────────────────────────────────────┤
│                 🎉                   │
│          Order Confirmed!            │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Order Token:    #CB1024        │  │
│  │ Pickup Counter: Counter 2      │  │
│  │ Pickup Slot:    12:30 - 12:40  │  │
│  │ Total Paid:     ₹180 (UPI)     │  │
│  │ Loyalty Earned: +18 Points     │  │
│  └────────────────────────────────┘  │
│                                      │
│       [ TRACK ORDER LIVE 📍 ]        │
└──────────────────────────────────────┘
```

### Screen 9: Live Order Tracking

```text
┌──────────────────────────────────────┐
│  9:41                   5G 📶 100% 🔋│
├──────────────────────────────────────┤
│  Live Order Tracking 📡              │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ORDER #CB1024                  │  │
│  │ 2× Burger, 1× Juice            │  │
│  │ [   PICKUP COUNTER: 2   ]      │  │
│  └────────────────────────────────┘  │
│                                      │
│  (✓) Order Placed                    │
│   │                                  │
│  (✓) Order Confirmed                 │
│   │                                  │
│  (🍳) Preparing in Kitchen           │
│   │                                  │
│  (●) Ready for Pickup (Counter 2)    │
│   │                                  │
│  ( ) Completed                       │
│                                      │
│       [ ⭐ Leave Review ]            │
└──────────────────────────────────────┘
```

### Screen 10: Profile & Rewards CRM

```text
┌──────────────────────────────────────┐
│  9:41                   5G 📶 100% 🔋│
├──────────────────────────────────────┤
│  My Campus Profile 👤                │
│  Jaswant Karun • CB-2024-2028        │
│  CS & Business Systems • 87541 59344 │
│  🥇 Gold Campus Diner                │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ⭐ 420 Loyalty Points          │  │
│  │ 100 pts = ₹10 off voucher      │  │
│  │ [ Redeem on Next Order ]       │  │
│  └────────────────────────────────┘  │
│                                      │
│  PAST ORDERS (1-Click Reorder)       │
│  #CB1020 • Cheese Burger Deluxe      │
│  ₹153 • Completed  [ 🔄 Reorder ]    │
└──────────────────────────────────────┘
```

---

## 3. Executive Admin Wireframe Layout

```text
┌────────────────────────────────────────────────────────────────────────┐
│ CAMPUSBITE ADMIN       [● Canteen Active]     [+ Add Item] [🔄 Reset]  │
├──────────────┬─────────────────────────────────────────────────────────┤
│ • Orders (23)│ Revenue: ₹12,450  Orders: 186  Pending: 23  Rating: 4.5★│
│ • Inventory  ├─────────────────────────────────────────────────────────┤
│ • Analytics  │ LIVE ORDERS BOARD                                       │
│ • AI Demand  │ ┌───────────────┐ ┌───────────────┐ ┌─────────────────┐ │
│ • Coupons    │ │ #CB1024 • ₹180│ │ #CB1025 • ₹140│ │ #CB1026 • ₹220  │ │
│ • Reviews    │ │ Burger × 2    │ │ Sandwich × 1  │ │ Thali × 2       │ │
│              │ │ Counter 2     │ │ Counter 1     │ │ Counter 3       │ │
│              │ │ [Mark Ready]  │ │ [Start Prep]  │ │ [Confirm Order] │ │
│              │ └───────────────┘ └───────────────┘ └─────────────────┘ │
└──────────────┴─────────────────────────────────────────────────────────┘
```
