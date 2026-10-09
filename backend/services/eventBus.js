/**
 * CampusBite Real-Time Notification Event Bus (SSE Engine)
 * Manages Server-Sent Events (SSE) connections for live updates to both
 * the Customer Website, Mobile App, and Admin Operations Hub.
 * Fully synchronized with JSON database and MongoDB persistence.
 */

const db = require('../data/db');

class NotificationEventBus {
  constructor() {
    this.clients = new Set();
    
    // Sync initial notifications from DB store
    if (db.data && Array.isArray(db.data.notifications) && db.data.notifications.length) {
      this.notifications = [...db.data.notifications];
    } else {
      this.notifications = [
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
      ];
      if (db.data) {
        db.data.notifications = [...this.notifications];
        db.saveData();
      }
    }

    // Keep connections alive with heartbeat ping every 25s
    setInterval(() => {
      this.heartbeat();
    }, 25000);
  }

  addClient(req, res) {
    const role = (req.query.role || 'student').toLowerCase();
    const userId = req.query.userId || 'u-101';
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx/proxies
    res.flushHeaders?.();

    const client = { id: clientId, res, role, userId };
    this.clients.add(client);

    // Send initial connected acknowledgement
    this.sendToClient(client, {
      type: 'CONNECTED',
      message: 'Real-time live notification stream connected',
      clientId: clientId,
      role: role,
      unreadCount: this.getUnreadCount(role, userId),
      timestamp: new Date().toISOString()
    });

    req.on('close', () => {
      this.clients.delete(client);
    });

    return client;
  }

  heartbeat() {
    for (const client of this.clients) {
      try {
        client.res.write(': heartbeat\n\n');
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  sendToClient(client, payload) {
    try {
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      this.clients.delete(client);
    }
  }

  broadcast(notification) {
    const record = {
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: notification.title || "CampusBite Alert",
      message: notification.message || "",
      type: notification.type || "INFO",
      target: notification.target || "all", // 'all', 'student', 'admin', 'user'
      userId: notification.userId || null,
      icon: notification.icon || "",
      data: notification.data || null,
      created_at: notification.created_at || new Date().toISOString(),
      read: notification.read !== undefined ? notification.read : false
    };

    // Store in memory (max 100)
    this.notifications.unshift(record);
    if (this.notifications.length > 100) {
      this.notifications.pop();
    }

    // Persist to JSON db store
    if (db.data && Array.isArray(db.data.notifications)) {
      db.data.notifications.unshift(record);
      if (db.data.notifications.length > 100) {
        db.data.notifications.pop();
      }
      db.saveData();
    }

    // Sync to MongoDB if available
    try {
      const { Notification: MongoNotification } = require('../data/mongo');
      if (MongoNotification) {
        MongoNotification.create(record).catch(() => {});
      }
    } catch (e) {}

    // Push to matching connected clients
    for (const client of this.clients) {
      let isRecipient = false;

      if (record.target === 'all') {
        isRecipient = true;
      } else if (record.target === 'admin' && client.role === 'admin') {
        isRecipient = true;
      } else if (record.target === 'student' && client.role !== 'admin') {
        if (!record.userId || record.userId === client.userId) {
          isRecipient = true;
        }
      } else if (record.target === 'user' && record.userId === client.userId) {
        isRecipient = true;
      }

      if (isRecipient) {
        this.sendToClient(client, {
          type: 'NOTIFICATION',
          notification: record,
          unreadCount: this.getUnreadCount(client.role, client.userId)
        });
      }
    }

    return record;
  }

  getNotifications(role = 'all', userId = null) {
    // Keep in sync with db.data.notifications
    if (db.data && Array.isArray(db.data.notifications)) {
      this.notifications = db.data.notifications;
    }

    return this.notifications.filter(n => {
      if (n.target === 'all') return true;
      if (role === 'admin' && n.target === 'admin') return true;
      if (role !== 'admin' && n.target === 'student') {
        if (!n.userId || !userId || n.userId === userId) return true;
      }
      if (userId && n.userId === userId) return true;
      return false;
    });
  }

  getUnreadCount(role = 'all', userId = null) {
    return this.getNotifications(role, userId).filter(n => !n.read).length;
  }

  markAllAsRead(role = 'all', userId = null) {
    const items = this.getNotifications(role, userId);
    items.forEach(n => { n.read = true; });

    // Also update in db.data.notifications
    if (db.data && Array.isArray(db.data.notifications)) {
      const targetIds = new Set(items.map(item => item.id));
      db.data.notifications.forEach(n => {
        if (targetIds.has(n.id)) {
          n.read = true;
        }
      });
      db.saveData();
    }

    // Sync to Mongo if available
    try {
      const { Notification: MongoNotification } = require('../data/mongo');
      if (MongoNotification) {
        const ids = items.map(i => i.id);
        MongoNotification.updateMany({ id: { $in: ids } }, { $set: { read: true } }).catch(() => {});
      }
    } catch (e) {}

    return items.length;
  }

  markAsRead(notificationId) {
    let found = this.notifications.find(item => item.id === notificationId);
    if (found) found.read = true;

    if (db.data && Array.isArray(db.data.notifications)) {
      const dbItem = db.data.notifications.find(item => item.id === notificationId);
      if (dbItem) {
        dbItem.read = true;
        found = dbItem;
      }
      db.saveData();
    }

    try {
      const { Notification: MongoNotification } = require('../data/mongo');
      if (MongoNotification) {
        MongoNotification.updateOne({ id: notificationId }, { $set: { read: true } }).catch(() => {});
      }
    } catch (e) {}

    return found;
  }
}

const eventBus = new NotificationEventBus();
module.exports = eventBus;
