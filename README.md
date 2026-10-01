# 🚀 CAMPUSBITE
### Smart Campus Canteen E-Business & Management Platform
*Order smart. Skip the queue. Manage better.*

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Status-Working%20Prototype-brightgreen.svg)]()
[![Course](https://img.shields.io/badge/Course-E--Business%20Management-blue.svg)]()

---

## 📌 Project Overview
CampusBite is a comprehensive B2C mobile e-business and canteen management platform designed to eliminate waiting queues in college canteens and empower canteen operators with real-time analytics and predictive kitchen intelligence.

### The Problem
During 40-minute college lunch breaks, over 75% of students spend 15–20 minutes standing in physical lines. At the same time, canteen managers operate with zero data visibility, leading to unpredictable food waste and frequent item stock-outs.

### The Solution: Customer Ordering + Business Intelligence
- **For Students:** Mobile pre-ordering, scheduled pickup slots, simulated instant UPI payments, 5-stage live order tracking, and 10% loyalty rewards.
- **For Canteen Operators:** Real-time order dispatch board, live inventory tracking with low-stock alerts, weekly revenue and peak hourly surge charts, and an **AI Demand Prediction Engine** that forecasts tomorrow's lunch requirements.

---

## 🏗️ Project Architecture

```
CampusBite/
├── backend/
│   ├── server.js               # Express application server
│   ├── data/
│   │   ├── db.js               # Data store & initial seed state
│   │   └── campusbite_store.json # Persistent JSON data file
│   └── routes/
│       ├── auth.js             # User login & registration
│       ├── products.js         # Menu catalog & inventory management
│       ├── orders.js           # Order placement & status workflow
│       ├── coupons.js          # Marketing discount coupons
│       ├── loyalty.js          # CRM & loyalty rewards ledger
│       ├── reviews.js          # Customer feedback & ratings
│       ├── analytics.js        # KPI calculations & rush analytics
│       └── demandPrediction.js # AI Predictive Demand Engine
├── frontend/
│   ├── index.html              # Unified SPA with mobile shell & admin dashboard
│   ├── css/
│   │   ├── style.css           # Design tokens, reset, typography
│   │   ├── mobile-shell.css    # Smartphone mockup & 10 student screens
│   │   └── admin.css           # Canteen Executive Dashboard styles
│   └── js/
│       ├── api.js              # REST client wrapper
│       ├── charts.js           # SVG interactive revenue & surge charts
│       ├── student.js          # Student ordering & tracking controller
│       ├── admin.js            # Admin dispatch & inventory controller
│       └── app.js              # Global coordinator & 5-min demo runner
├── docs/
│   ├── 02_BUSINESS_MODEL_CANVAS.md     # 9-box Business Model Canvas
│   ├── 03_CUSTOMER_SURVEY_ANALYSIS.md # 48-respondent survey & interview
│   ├── 04_WIREFRAMES_AND_USER_FLOW.md  # 10 ASCII wireframes & navigation
│   ├── 05_E_BUSINESS_INTEGRATION.md   # Payment, CRM, Marketing & Security
│   ├── 06_USER_TESTING_AND_ITERATION.md # 3 user tests & design evolutions
│   ├── 07_ASSIGNMENT_REPORT.md        # Complete 10-12 page academic report
│   └── 08_DEMO_SCRIPT_AND_PITCH.md    # 5-minute timed presentation script
├── package.json
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Installation
Ensure Node.js (v18+) is installed on your machine.
```bash
npm install
```

### 2. Launch Platform
```bash
npm start
```
The platform will launch immediately:
- **Web App & Mobile View:** [http://localhost:3000](http://localhost:3000)
- **Direct Student Mobile View:** [http://localhost:3000#student](http://localhost:3000#student)
- **Direct Executive Admin Dashboard:** [http://localhost:3000#admin](http://localhost:3000#admin)

---

## 🎬 5-Minute Live Presentation Walkthrough
In the top navigation bar of the application, click **`⚡ 5-Min Demo Tour`** to automatically trigger the step-by-step presentation sequence:

1. **Student Pre-Order:** Student adds *Classic Burger* + *Fresh Lemon Juice*.
2. **Coupon Applied:** Student applies `CAMPUS20` for an instant 20% discount.
3. **Slot & Payment:** Selects `12:30 PM – 12:40 PM` pickup slot and completes simulated UPI payment.
4. **Live Stepper:** Token `#CB1031` generated with Counter 2 assignment; 5-stage tracking updates in real time.
5. **Admin Dispatch:** Switch to Admin Dashboard to advance orders (`Placed` → `Confirmed` → `Preparing` → `Ready`).
6. **Executive Analytics:** View daily revenue (₹12,450), peak lunch surge charts (12:00 PM – 1:30 PM), and stock levels.
7. **AI Demand Prediction:** View tomorrow's lunch forecast (`Burger: Expected 72 | Stock 24 | Recommendation: Prepare +48`) and click **[Accept Recommendation]** to update the kitchen prep sheet.

---

## 📝 Assignment Deliverables Mapping (35-Mark Rubric)
| Rubric Requirement | Project Evidence |
| :--- | :--- |
| **Real Business Problem** | Documented in `docs/03_CUSTOMER_SURVEY_ANALYSIS.md` & `docs/07_ASSIGNMENT_REPORT.md` |
| **Business Model Canvas** | Detailed in `docs/02_BUSINESS_MODEL_CANVAS.md` |
| **6+ Wireframes** | 10 complete wireframe screens detailed in `docs/04_WIREFRAMES_AND_USER_FLOW.md` |
| **5+ Working Features** | Catalog browsing, Cart, Coupon engine, Simulated UPI, Order tracking, Admin Kanban, Inventory stock management, AI prediction |
| **E-Business Integration** | Payment simulation, CRM loyalty (10%), Digital marketing, RBAC security (`docs/05_E_BUSINESS_INTEGRATION.md`) |
| **User Testing & Iteration** | 3-user testing with real quotes and design iterations in `docs/06_USER_TESTING_AND_ITERATION.md` |
| **Academic Report** | 10-12 page assignment report in `docs/07_ASSIGNMENT_REPORT.md` |
| **Presentation Pitch** | 5-minute timed script in `docs/08_DEMO_SCRIPT_AND_PITCH.md` |
