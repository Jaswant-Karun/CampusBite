# CampusBite — E-Business Integration & Architecture

This document articulates the core electronic business integrations that elevate CampusBite from a conventional ordering application to an enterprise-grade M-Commerce and Management Platform.

---

## 1. Digital Payment Gateway Integration
To solve the acute physical queue bottleneck caused by cash tendering and loose change shortages, CampusBite provides a multi-channel simulated electronic payment architecture:

- **Simulated Unified Payments Interface (UPI):**
  - Generates dynamic Virtual Payment Address (`campusbite@upi`) and order-specific payment requests.
  - Implements simulated instant webhook approval simulating real-world PSP callback flows (Razorpay / PhonePe / Cashfree).
  - Synchronously creates an immutable order token, assigns pickup counters, and updates kitchen dispatch.
- **Card & Cash-at-Counter Options:**
  - Accommodates cards while ensuring zero sensitive cardholder data (PAN, CVV) is ever persisted in plain text, adhering to PCI-DSS principles.
  - Supports "Pay at Counter" with automated cash collection reconciliation.

---

## 2. Customer Relationship Management (CRM) & Loyalty Engine
Retention and repeat transactions are reinforced through gamified loyalty mechanics:

- **Tiered Loyalty System:**
  - **Bronze Member:** 0 – 199 Points
  - **Silver Saver:** 200 – 399 Points
  - **Gold Campus Diner:** 400+ Points
- **Point Accrual Rule:**
  $$\text{Points Earned} = \left\lfloor \frac{\text{Order Total (₹)}}{10} \right\rfloor$$
  *(Students earn 1 point for every ₹10 spent, representing a 10% value return).*
- **Point Redemption Rule:**
  Every 100 points converts directly to a ₹10 instant bill discount at checkout.
- **Transaction Ledger:**
  Every addition and deduction is logged with an immutable audit entry in `loyalty_transactions`.

---

## 3. Digital Marketing & Dynamic Campaign Promotion
The administration dashboard provides a promotional engine:
- **Campaign Creator:** Admins can publish flash promotions with defined parameters:
  - Promo code string (e.g. `CAMPUS20`, `STUDENT10`, `EXAMSNACK`).
  - Discount type (`percentage` vs `flat`).
  - Minimum order threshold (e.g., minimum ₹100 spend).
  - Discount cap (e.g., maximum ₹50 discount).
  - Expiry dates and category restrictions.
- **Immediate Propagation:** Once published, new campaigns instantly reflect on the student app carousel banner.

---

## 4. Security, Privacy & Legal Architecture

### Authentication & Token-Based Sessions
- **Stateless Bearer Tokens:** Session management is handled via cryptographically signed tokens (`cb_token_...`).
- **Role-Based Access Control (RBAC):**
  - **Student Role:** Restricted strictly to menu browsing, placing personal orders, viewing personal order history, and redeeming their own loyalty points.
  - **Staff Role:** Access restricted to Kitchen Display System (view incoming items and advance cooking status).
  - **Admin Role:** Full privileged access to executive analytics, product deletion, inventory adjustments, and coupon management.

### Data Privacy & Legal Compliance
- **Data Minimization Principle:** CampusBite collects solely operational parameters (name, campus email, department, phone number). No sensitive personal telemetry or financial secrets are retained.
- **Audit Logging:** Every administrative inventory modification and price adjustment maintains timestamped records.

---

## 5. Core Innovation: AI-Driven Predictive Demand Engine

### Business Challenge
Traditional college canteens operate reactively: meals are cooked on guesswork, leading to 30%+ stock-outs during unexpected rushes and 15–20% food waste on slower lecture days.

### CampusBite Solution
The AI Demand Prediction Engine calculates predicted meal consumption before the lunch hour begins:

$$\text{Expected Demand}_i = \bar{D}_{i, \text{day}} \times F_{\text{rush}} \times F_{\text{promo}}$$

Where:
- $\bar{D}_{i, \text{day}}$ is the historical moving average for item $i$ on that specific weekday.
- $F_{\text{rush}}$ is the scheduled campus timetable surge factor (12:00 PM – 1:30 PM break).
- $F_{\text{promo}}$ is the active coupon multiplier (e.g. 1.25x surge for items featured in `CAMPUS20`).

### Actionable Kitchen Guidance
The engine contrasts predicted volume against live inventory and outputs unambiguous kitchen batch prep directives:
- *Example:* `Classic Burger: Forecast 72 | Current Stock 24 | Recommendation: Prepare +48 units`.
- With a single click on **[Accept Recommendation]**, the kitchen prep sheet updates and stock is replenished seamlessly.
