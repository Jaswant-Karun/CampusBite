const mongoose = require('mongoose');

async function syncUser() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/campusbite');
    const db = mongoose.connection.db;
    
    await db.collection('users').updateOne(
      { id: 'u-101' },
      {
        $set: {
          name: 'Jaswant Karun',
          phone: '87541 59344',
          studentId: 'CB-2024-2028',
          department: 'Computer Science & Business Systems',
          email: 'jaswant@campus.edu',
          alternate_email: '24cb023@kpriet.ac.in',
          wallet_balance: 850,
          loyalty_points: 420
        }
      },
      { upsert: true }
    );

    await db.collection('orders').updateMany(
      { user_id: 'u-101' },
      {
        $set: {
          customer_name: 'Jaswant Karun',
          customer_phone: '87541 59344'
        }
      }
    );

    console.log('✅ [MongoDB Sync] Jaswant Karun details synchronized into users and orders collections!');
  } catch (err) {
    console.error('MongoDB sync error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

syncUser();
