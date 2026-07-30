const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Incident = require('../models/Incident');
const DetectionHistory = require('../models/DetectionHistory');
const { createReport } = require('../services/insights');

router.post('/generate', verifyToken, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body || {};
    let filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const incidents = await Incident.find(filter).sort({ createdAt: -1 }).lean();
    const detections = await DetectionHistory.find(filter).sort({ createdAt: -1 }).lean();

    const report = createReport({ incidents, detections, user: req.user, dateRange: { startDate, endDate } });
    res.json({ status: 'success', report });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
