const express = require('express');
const router = express.Router();
const db = require('../data/db');

// Helper to determine tier details based on points
function getTierInfo(points) {
  if (points >= 700) {
    return {
      tier: 'Platinum Connoisseur',
      tier_badge: 'PLATINUM',
      next_tier: 'Max Tier Reached',
      next_tier_pts: 700,
      progress_percent: 100
    };
  } else if (points >= 400) {
    const progress = Math.min(100, Math.round(((points - 400) / 300) * 100));
    return {
      tier: 'Gold Campus Diner',
      tier_badge: 'GOLD',
      next_tier: 'Platinum (700 pts)',
      next_tier_pts: 700,
      progress_percent: Math.max(10, progress)
    };
  } else if (points >= 200) {
    const progress = Math.min(100, Math.round(((points - 200) / 200) * 100));
    return {
      tier: 'Silver Saver',
      tier_badge: 'SILVER',
      next_tier: 'Gold (400 pts)',
      next_tier_pts: 400,
      progress_percent: Math.max(10, progress)
    };
  } else {
    const progress = Math.min(100, Math.round((points / 200) * 100));
    return {
      tier: 'Bronze Member',
      tier_badge: 'BRONZE',
      next_tier: 'Silver (200 pts)',
      next_tier_pts: 200,
      progress_percent: Math.max(5, progress)
    };
  }
}

// GET user loyalty points, summary stats & ledger history
router.get('/:user_id', (req, res) => {
  const user = db.data.users.find(u => u.id === req.params.user_id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const currentPoints = Number(user.loyalty_points) || 0;
  const allUserTxs = (db.data.loyalty_transactions || []).filter(lt => lt.user_id === req.params.user_id);

  // Compute points earned and points used directly from ledger transactions
  let pointsEarned = 0;
  let pointsUsed = 0;

  allUserTxs.forEach(tx => {
    const pts = Number(tx.points) || 0;
    const type = (tx.type || '').toLowerCase();
    if (pts > 0 || type === 'earned') {
      pointsEarned += Math.abs(pts);
    } else if (pts < 0 || type === 'redeemed') {
      pointsUsed += Math.abs(pts);
    }
  });

  // Reconcile if historical ledger had missing baseline transactions
  const netBalance = pointsEarned - pointsUsed;
  if (netBalance < currentPoints) {
    pointsEarned += (currentPoints - netBalance);
  }

  // Sort transactions: newest first
  const sortedTransactions = [...allUserTxs].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const tierInfo = getTierInfo(currentPoints);
  const pointValueInr = Math.floor(currentPoints / 100) * 10;

  res.json({
    success: true,
    current_points: currentPoints,
    loyalty_points: currentPoints, // Backward compatibility
    points_earned: pointsEarned,
    points_used: pointsUsed,
    point_value_inr: pointValueInr,
    earning_rule: 'Every ₹100 spent = 10 loyalty points (1 pt per ₹10)',
    redemption_rule: '100 points = ₹10 off canteen order',
    points_per_100_inr: 10,
    tier: tierInfo.tier,
    tier_badge: tierInfo.tier_badge,
    next_tier: tierInfo.next_tier,
    next_tier_pts: tierInfo.next_tier_pts,
    progress_percent: tierInfo.progress_percent,
    transactions: sortedTransactions
  });
});

// POST redeem loyalty points
router.post('/redeem', async (req, res) => {
  const { user_id, points, credit_to_wallet } = req.body;
  const user = db.data.users.find(u => u.id === user_id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const currentPoints = Number(user.loyalty_points) || 0;
  const ptsToRedeem = Number(points) || 100;

  if (ptsToRedeem < 100) {
    return res.status(400).json({ 
      success: false, 
      message: 'Minimum redemption is 100 loyalty points (₹10 value).' 
    });
  }

  if (currentPoints < ptsToRedeem) {
    return res.status(400).json({ 
      success: false, 
      message: `Insufficient points. You have ${currentPoints} points, but requested ${ptsToRedeem}.` 
    });
  }

  // Calculate voucher amount: Every 100 points = ₹10
  const discountAmount = Math.floor(ptsToRedeem / 100) * 10;
  user.loyalty_points = currentPoints - ptsToRedeem;

  // If credit_to_wallet is requested, immediately top-up CampusPay wallet
  if (credit_to_wallet) {
    user.wallet_balance = (user.wallet_balance || 0) + discountAmount;
  }

  const tx = {
    id: 'lt-' + Date.now(),
    user_id: user.id,
    points: -ptsToRedeem,
    type: 'redeemed',
    description: credit_to_wallet 
      ? `Redeemed ${ptsToRedeem} pts → ₹${discountAmount} added to CampusPay Wallet`
      : `Redeemed ${ptsToRedeem} pts for ₹${discountAmount} Canteen Voucher`,
    date: new Date().toISOString()
  };

  db.data.loyalty_transactions = db.data.loyalty_transactions || [];
  db.data.loyalty_transactions.unshift(tx);
  db.saveData();

  // Sync to MongoDB if available
  try {
    const { LoyaltyTransaction: MongoLT, User: MongoUser } = require('../data/mongo');
    if (MongoLT) {
      await MongoLT.create(tx);
    }
    if (MongoUser) {
      await MongoUser.updateOne(
        { id: user.id }, 
        { 
          $set: { 
            loyalty_points: user.loyalty_points,
            wallet_balance: user.wallet_balance
          } 
        }
      );
    }
  } catch (err) {}

  // Recalculate lifetime stats
  const allUserTxs = db.data.loyalty_transactions.filter(lt => lt.user_id === user.id);
  let pointsEarned = 0;
  let pointsUsed = 0;
  allUserTxs.forEach(t => {
    const p = Number(t.points) || 0;
    if (p > 0 || (t.type || '').toLowerCase() === 'earned') pointsEarned += Math.abs(p);
    else if (p < 0 || (t.type || '').toLowerCase() === 'redeemed') pointsUsed += Math.abs(p);
  });
  if (pointsEarned - pointsUsed < user.loyalty_points) {
    pointsEarned += (user.loyalty_points - (pointsEarned - pointsUsed));
  }

  res.json({
    success: true,
    message: `Successfully redeemed ${ptsToRedeem} points for ₹${discountAmount} voucher!`,
    current_points: user.loyalty_points,
    points_redeemed: ptsToRedeem,
    points_earned: pointsEarned,
    points_used: pointsUsed,
    discount_voucher_value: discountAmount,
    wallet_credited: credit_to_wallet ? discountAmount : 0,
    wallet_balance: user.wallet_balance,
    transaction: tx
  });
});

module.exports = router;
