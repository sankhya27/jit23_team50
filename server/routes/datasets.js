const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const Incident = require('../models/Incident');
const { generateInsight } = require('../services/insights');

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const datasets = [];

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] || '';
      return acc;
    }, {});
  });
}

function parseDataset(filePath, originalName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.json') {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  if (ext === '.csv') {
    return parseCsv(content);
  }

  return content.split(/\r?\n/).filter(Boolean).map((line) => ({ value: line }));
}

function analyzeDataset(records) {
  const values = records.map((record) => Number(record.packet_rate || record.packetRate || record.packets_from_source || record.byte_count || record.byteCount || 0));
  const maxValue = values.length ? Math.max(...values.filter((value) => Number.isFinite(value))) : 0;
  const avgValue = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const suspicious = maxValue > 25000 || avgValue > 12000;

  const confidence = suspicious ? 0.86 : 0.34;
  const attackType = suspicious ? 'Dataset-driven DDoS Pattern' : 'Normal Traffic Pattern';
  const threatLevel = suspicious ? (confidence > 0.8 ? 'High' : 'Medium') : 'Low';
  const explanation = suspicious
    ? `The uploaded dataset shows repeated high-volume traffic patterns with peak values around ${maxValue}. This resembles a flood-style attack profile.`
    : `The uploaded dataset appears to contain regular traffic characteristics with moderate volume and no strong attack indicators.`;
  const recommendations = suspicious
    ? ['Apply rate limiting to the suspicious traffic source.', 'Inspect the uploaded flow for repeated burst patterns.', 'Escalate the alert if the pattern continues.']
    : ['Continue monitoring the traffic flow.', 'Store the dataset for future baseline comparisons.'];

  return {
    is_ddos: suspicious,
    prediction: suspicious ? 'DDoS Attack' : 'Normal Traffic',
    confidence,
    attack_type: attackType,
    threat_level: threatLevel,
    explanation,
    recommendations,
  };
}

router.post('/upload', verifyToken, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please attach a CSV, JSON, or TXT dataset.' });
    }

    const records = parseDataset(req.file.path, req.file.originalname);
    const analysis = analyzeDataset(records);
    const insight = await generateInsight({
      isAttack: analysis.is_ddos,
      confidence: analysis.confidence,
      attackType: analysis.attack_type,
      trafficData: { packet_rate: records[0]?.packet_rate || records[0]?.packetRate || 0, byte_count: records[0]?.byte_count || records[0]?.byteCount || 0, duration: records[0]?.duration || 0 },
      sourceIP: 'uploaded-dataset',
    });

    const entry = {
      id: `${Date.now()}`,
      filename: req.file.originalname,
      storedAt: new Date().toISOString(),
      recordCount: records.length,
      preview: records.slice(0, 5),
      size: req.file.size,
    };
    datasets.unshift(entry);

    await Incident.createIncident({
      username: req.user.username,
      attackType: analysis.attack_type,
      severity: analysis.is_ddos ? (analysis.confidence > 0.8 ? 'high' : 'medium') : 'low',
      sourceIP: 'uploaded-dataset',
      trafficData: {
        packetRate: records.length ? records[0].packet_rate || records[0].packetRate || 0 : 0,
        duration: records.length ? records[0].duration || 0 : 0,
        byteCount: records.length ? records[0].byte_count || records[0].byteCount || 0 : 0,
      },
      detection: {
        confidence: analysis.confidence,
        ensembleScore: analysis.confidence,
      },
      mitigation: { actionsTaken: analysis.recommendations, ipBlocked: analysis.is_ddos },
      recommendations: analysis.recommendations,
      source: 'manual',
    });

    res.json({
      status: 'success',
      dataset: entry,
      analysis: {
        ...analysis,
        insight,
      },
      message: 'Dataset uploaded successfully and analyzed.',
    });
  } catch (error) {
    res.status(400).json({ error: `Unable to parse dataset: ${error.message}` });
  }
});

router.get('/', verifyToken, requireRole('admin'), (_req, res) => {
  res.json({ status: 'success', datasets });
});

module.exports = router;