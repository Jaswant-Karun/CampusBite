const express = require('express');
const router = express.Router();
const eventBus = require('../services/eventBus');

// SSE Real-time Notification Stream
router.get('/stream', (req, res) => {
  eventBus.addClient(req, res);
});

// GET recent notifications history
router.get('/', (req, res) => {
  const { role, userId } = req.query;
  const list = eventBus.getNotifications(role, userId);
  const unreadCount = eventBus.getUnreadCount(role, userId);
  res.json({
    success: true,
    count: list.length,
    unreadCount: unreadCount,
    notifications: list
  });
});

// POST create notification directly
router.post('/', (req, res) => {
  const { title, message, type, target, userId, icon, data } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message are required' });
  }
  const notif = eventBus.broadcast({
    title,
    message,
    type: type || 'INFO',
    target: target || 'student',
    userId: userId || null,
    icon: icon || '',
    data: data || {}
  });
  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    notification: notif
  });
});

// POST mark all notifications as read
router.post('/read-all', (req, res) => {
  const { role, userId } = req.body;
  const updated = eventBus.markAllAsRead(role, userId);
  res.json({
    success: true,
    message: `${updated} notifications marked as read`,
    unreadCount: 0
  });
});

// POST mark specific notification as read
router.post('/read/:id', (req, res) => {
  const item = eventBus.markAsRead(req.params.id);
  res.json({
    success: true,
    notification: item
  });
});

// POST broadcast test notification (for live testing)
router.post('/test', (req, res) => {
  const { title, message, type, target, icon, data } = req.body;
  const notif = eventBus.broadcast({
    title: title || "Live Canteen Announcement",
    message: message || "Fresh hot Samosas just arrived at Counter 2!",
    type: type || "INFO",
    target: target || "all",
    icon: icon || "",
    data: data || {}
  });

  res.json({
    success: true,
    message: "Notification broadcasted successfully via SSE",
    notification: notif
  });
});

module.exports = router;
