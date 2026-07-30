const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { generateInsight } = require('../services/insights');

router.post('/explain', verifyToken, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const insight = await generateInsight(payload);
    res.json({ status: 'success', insight });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
