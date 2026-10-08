const express = require('express');
const router = express.Router();
const db = require('../data/db');

// GET user loyalty points & transaction ledger
router.get('/:user_id', (req, res) => {
  const user = db.data.users.find(u => u.id === req.params.user_id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const transactions = db.data.loyalty_transactions.filter(lt => lt.user_id === req.params.user_id);

  res.json({
    success: true,
    loyalty_points: user.loyalty_points || 0,
    point_value_inr: Math.floor((user.loyalty_points || 0) / 100) * 10,
    tier: (user.loyalty_points || 0) > 400 ? 'Gold Campus Diner' : (user.loyalty_points || 0) > 200 ? 'Silver Saver' : 'Bronze Member',
    transactions: transactions
  });
});

// POST redeem points
router.post('/redeem', async (req, res) => {
  const { user_id, points } = req.body;
  const user = db.data.users.find(u => u.id === user_id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const ptsToRedeem = Number(points) || 100;
  if (user.loyalty_points < ptsToRedeem) {
    return res.status(400).json({ success: false, message: `Insufficient points. You have ${user.loyalty_points} points.` });
  }

  const discountAmount = Math.floor(ptsToRedeem / 100) * 10;
  user.loyalty_points -= ptsToRedeem;

  const tx = {
    id: 'lt-' + Date.now(),
    user_id: user.id,
    points: -ptsToRedeem,
    type: 'redeemed',
    description: `Redeemed for ₹${discountAmount} Canteen Voucher`,
    date: new Date().toISOString()
  };

  db.data.loyalty_transactions.unshift(tx);
  db.saveData();

  // Sync to MongoDB if available
  try {
    const { LoyaltyTransaction: MongoLT, User: MongoUser } = require('../data/mongo');
    if (MongoLT) {
      await MongoLT.create(tx);
    }
    if (MongoUser) {
      await MongoUser.updateOne({ id: user.id }, { $set: { loyalty_points: user.loyalty_points } });
    }
  } catch (err) {}

  res.json({
    success: true,
    message: `Successfully redeemed ${ptsToRedeem} points for ₹${discountAmount} voucher!`,
    current_points: user.loyalty_points,
    discount_voucher_value: discountAmount
  });
});

module.exports = router;
