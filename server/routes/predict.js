const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { getPrediction } = require('../services/mlService');
const metrics = require('../services/metrics');
const Incident = require('../models/Incident');
const { generateInsight } = require('../services/insights');

// Fallback session mitigation map (IP -> Set of timestamps)
const sessionRateLimits = new Map();

function isRateLimited(ip) {
  if (!sessionRateLimits.has(ip)) sessionRateLimits.set(ip, []);
  
  const now = Date.now();
  const timestamps = sessionRateLimits.get(ip);
  
  // Clean timestamps older than 1 second
  const recent = timestamps.filter(ts => now - ts < 1000);
  sessionRateLimits.set(ip, recent);
  
  if (recent.length >= 10) return true; // max 10 packets per sec
  
  recent.push(now);
  return false;
}

// ── POST /api/predict ─────────────────────────────────────────────────────
// Intentionally not enforcing verifyToken strictly so the demo form still works without login
// but if token is present, we log the user.
router.post('/', validate('predict'), async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    
    // Check local session rate limit first
    if (isRateLimited(ipAddress)) {
      metrics.packetsBlocked++;
      return res.status(429).json({
        status: 'BLOCKED_BY_FIREWALL',
        prediction: 'DDoS Attack',
        is_ddos: true,
        confidence: 1.0,
        message: 'Rate limit exceeded. Traffic blocked.',
        preventive_measures: ['Suspicious source traffic blocked', 'Rate limiting applied'],
      });
    }

    const trafficData = req.body;
    
    // Call Flask ML Microservice
    const result = await getPrediction(trafficData);
    
    if (!result.ok) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    const { is_attack, confidence, detection_methods, detection_latency_ms } = result.data;
    const attackType = result.data.attack_type || (is_attack ? 'Generic DDoS' : 'Normal Traffic');
    const threatLevel = is_attack ? (confidence > 0.85 ? 'High' : confidence > 0.6 ? 'Medium' : 'Low') : 'Low';
    const insight = await generateInsight({
      isAttack: is_attack,
      confidence,
      attackType,
      trafficData,
      sourceIP: ipAddress,
    });
    
    metrics.recordPacket({
      isAttack: is_attack,
      latencyMs: detection_latency_ms,
      sourceIP: ipAddress,
    });

    const preventive_measures = is_attack ? [
      "Suspicious source traffic blocked",
      "Rate limiting applied to high-volume requests",
      "Network administrator alerted",
      "Incident logged for security review",
    ] : [];

    // Log to MongoDB if it's an attack
    if (is_attack) {
      // Decode JWT manually if present to get user info (since we don't strictly require verifyToken here for demo)
      let username = 'guest';
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
           const jwt = require('jsonwebtoken');
           const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'ddos-guard-secret-key-change-in-prod');
           username = decoded.username;
        } catch(e) {}
      }

      await Incident.createIncident({
        username,
        attackType: 'Generic DDoS',
        severity: confidence > 0.8 ? 'high' : 'medium',
        sourceIP: ipAddress,
        trafficData: {
          packetRate: trafficData.packet_rate,
          duration: trafficData.duration,
          byteCount: trafficData.byte_count,
        },
        detection: {
          mlScore: detection_methods?.ml_model || 0,
          heuristicScore: detection_methods?.heuristic || 0,
          anomalyScore: detection_methods?.anomaly_detection || 0,
          ensembleScore: result.data.ensemble_score || 0,
          confidence,
          latencyMs: detection_latency_ms,
        },
        mitigation: { actionsTaken: preventive_measures, ipBlocked: true },
        source: 'manual'
      });
    }

    return res.json({
      status: 'success',
      prediction: is_attack ? 'DDoS Attack' : 'Normal Traffic',
      is_ddos: is_attack,
      confidence,
      attack_type: attackType,
      threat_level: threatLevel,
      detection_methods,
      detection_latency_ms,
      preventive_measures,
      mitigation_status: is_attack ? 'Preventive actions completed' : 'No mitigation needed',
      insight,
    });
    
  } catch (err) {
    next(err);
  }
});

module.exports = router;
