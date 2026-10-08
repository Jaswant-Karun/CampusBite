/**
 * CampusBite Real-Time Notification Event Bus (SSE Engine)
 * Manages Server-Sent Events (SSE) connections for live updates to both
 * the Customer Website, Mobile App, and Admin Operations Hub.
 */

class NotificationEventBus {
  constructor() {
    this.clients = new Set();
    this.notifications = [
      {
        id: "notif-init-1",
        title: "Welcome to CampusBite",
        message: "Order online to skip long counter queues. Express Counter 1 & 2 are open.",
        type: "SYSTEM",
        target: "all",
        icon: "",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        read: false
      },
      {
        id: "notif-init-2",
        title: "Flash Offer Active",
        message: "Use code FIRSTBITE for 20% discount on your student meal tray!",
        type: "PROMO",
        target: "student",
        icon: "",
        created_at: new Date(Date.now() - 1800000).toISOString(),
        read: false
      },
      {
        id: "notif-init-3",
        title: "Kitchen System Online",
        message: "Live POS sync with MongoDB active. Real-time token dispatch enabled.",
        type: "ADMIN",
        target: "admin",
        icon: "",
        created_at: new Date(Date.now() - 2400000).toISOString(),
        read: false
      }
    ];

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
      created_at: new Date().toISOString(),
      read: false
    };

    // Store in history (max 50)
    this.notifications.unshift(record);
    if (this.notifications.length > 50) {
      this.notifications.pop();
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
        isRecipient = true;
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
    return this.notifications.filter(n => {
      if (n.target === 'all') return true;
      if (role === 'admin' && n.target === 'admin') return true;
      if (role !== 'admin' && n.target === 'student') return true;
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
    return items.length;
  }

  markAsRead(notificationId) {
    const n = this.notifications.find(item => item.id === notificationId);
    if (n) n.read = true;
    return n;
  }
}

const eventBus = new NotificationEventBus();
module.exports = eventBus;
