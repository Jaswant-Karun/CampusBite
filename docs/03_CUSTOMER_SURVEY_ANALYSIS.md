# CampusBite — Customer Survey & Problem Analysis Report

## 1. Survey Methodology & Sample Demographics
As mandated by the E-Business Management assignment requirements, primary market research was conducted via a structured Google Form survey and in-person interviews across the campus community.
- **Total Respondents:** 48 Campus Members
- **Demographic Split:** 78% Undergraduate Students, 14% Postgraduate/Research Scholars, 8% Teaching Faculty & Staff
- **Survey Period:** September 2026

---

## 2. Key Survey Questions & Quantitative Findings

### Q1: How often do you purchase food or beverages from the college canteen?
- **Daily:** 56.3%
- **3–4 times a week:** 27.1%
- **1–2 times a week:** 12.5%
- **Rarely:** 4.1%
> *Key Takeaway:* Over 83% of the campus population relies heavily on the canteen for daily sustenance, indicating high transaction frequency.

### Q2: How much time do you usually spend waiting in the canteen queue?
- **Less than 5 minutes:** 6.2%
- **5–10 minutes:** 18.8%
- **10–15 minutes:** 41.7%
- **More than 15 minutes:** 33.3%
> *Key Takeaway:* Exactly 75% of patrons lose 10 to 20+ minutes per visit simply standing in line. Considering college lunch breaks are typically 40–45 minutes, students lose roughly 40% of their free break time waiting in line.

### Q3: Do you experience severe crowding during lunch and short break periods?
- **Yes, consistently:** 81.2%
- **Sometimes:** 14.6%
- **No:** 4.2%

### Q4: Would you use a smartphone application to pre-order food and pick it up at a designated counter?
- **Yes, definitely:** 89.6%
- **Maybe / Depends on ease:** 8.3%
- **No:** 2.1%

### Q5: Which features would you find most beneficial in a campus canteen app?
*(Multiple selection allowed)*
1. **Pre-order with designated pickup time slot:** 93.8%
2. **Contactless UPI / Digital payment:** 87.5%
3. **Live order preparation tracking:** 81.3%
4. **Student discount coupons & daily combo offers:** 77.1%
5. **Loyalty points / cashback program:** 68.8%
6. **Detailed dietary indicators (Veg/Non-Veg, Calories):** 54.2%

### Q6: Would selecting a designated 10-minute pickup slot (e.g., 12:30 PM – 12:40 PM) help your schedule?
- **Yes:** 91.7%
- **No:** 8.3%

### Q7: Would digital offers, combo discounts, and loyalty points encourage you to order more often?
- **Yes:** 83.3%
- **Maybe:** 12.5%
- **No:** 4.2%

### Q8: What is the single biggest problem with the current canteen ordering process?
*(Qualitative Open Responses Summary)*
1. *"By the time I reach the cash counter, the snack I wanted (like samosa or grilled sandwich) is sold out."* (Stock visibility issue)
2. *"Tendering change for cash (₹10, ₹20) takes minutes and slows down the whole queue."* (Payment friction)
3. *"Chaos around the delivery counter because people don't know whose order is ready."* (Lack of order status tracking)
4. *"Faculty members avoid the canteen entirely during lunch because of the crowd."* (Lost high-margin customer segment)

---

## 3. Canteen Manager Interview Insights
An in-depth semi-structured interview was conducted with **Mr. Ramesh**, Head Canteen Operations Manager:
- **Pain Point 1 — Demand Unpredictability:** *"Some days we make 80 burgers and run out by 12:45 PM, turning away 30 students. Other days we overcook and waste 25 unsold meals."*
- **Pain Point 2 — Peak Hour Strain:** 80% of revenue occurs between 11:30 AM and 1:45 PM, causing staff burnout and delayed orders.
- **Pain Point 3 — Lack of Business Analytics:** Canteen management relies on pen-and-paper or basic cash registers, with no insight into repeat customers, low-margin vs high-margin items, or stock trends.

---

## 4. Strategic Implications for CampusBite Architecture
The survey and interview findings directly dictated the CampusBite functional requirements:
1. **Time-Slot Scheduling:** Implemented pre-order pickup slot picker (10-minute intervals).
2. **Real-Time Stock Depletion:** Stock decrements synchronously on checkout; out-of-stock items are automatically greyed out.
3. **Simulated UPI Gateway:** Eliminates cash change delays.
4. **Live 5-Stage Stepper:** Eliminates counter clustering.
5. **AI Demand Prediction Engine:** Provides the canteen manager with tomorrow's predicted lunch volume so the kitchen can prep optimal quantities in advance.
