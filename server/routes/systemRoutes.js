const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { successResponse } = require('../utils/responseHelper');

// Public Health Check
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    system: 'AI-Powered Online Examination System',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// User Notifications
router.get('/notifications', protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    return successResponse(res, 200, 'Notifications retrieved', notifications);
  } catch (error) {
    next(error);
  }
});

router.patch('/notifications/:id/read', protect, async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    return successResponse(res, 200, 'Notification marked as read', notif);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
