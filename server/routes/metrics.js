const express = require("express");
const router = express.Router();
const metrics = require("../services/metrics");
const Incident = require("../models/Incident");
const DetectionHistory = require("../models/DetectionHistory");

// ======================================================
// GET METRICS (Combines Historical Totals from MongoDB + Live Transient Session)
// ======================================================

router.get("/", async (req, res) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store"
    });

    try {
        const live = metrics.getSummary();

        // Query historical totals from MongoDB so backend restarts never reset total counts
        const totalIncidentsCount = await Incident.countDocuments();
        const totalDetectionsCount = await DetectionHistory.countDocuments();
        const blockedDetectionsCount = await DetectionHistory.countDocuments({ decision: "Blocked" });
        const allowedDetectionsCount = await DetectionHistory.countDocuments({ decision: "Allowed" });

        // Sum overall historical packets/traffic from incidents if available
        const incidentAgg = await Incident.aggregate([
            {
                $group: {
                    _id: null,
                    totalBytes: { $sum: "$trafficData.byteCount" },
                    totalPackets: { $sum: "$trafficData.packetRate" }
                }
            }
        ]);

        const dbPackets = incidentAgg[0]?.totalPackets || 0;
        const totalHistoricalAttacks = totalIncidentsCount;
        const totalHistoricalBlocked = blockedDetectionsCount || totalIncidentsCount;

        const blendedPacketsSent = dbPackets + (live.packets_sent || 0);
        const blendedAttacksDetected = totalHistoricalAttacks + (live.attacks_detected || 0);
        const blendedPacketsBlocked = totalHistoricalBlocked + (live.packets_blocked || 0);

        res.json({
            ...live,
            packets_sent: blendedPacketsSent,
            attacks_detected: blendedAttacksDetected,
            packets_blocked: blendedPacketsBlocked,
            effectiveness_pct: null,
            total_historical_incidents: totalIncidentsCount,
            total_historical_detections: totalDetectionsCount
            ,
            mitigation_effectiveness_pct: totalDetectionsCount > 0
                ? Number(((blockedDetectionsCount / totalDetectionsCount) * 100).toFixed(1))
                : null,
            total_historical_allowed: allowedDetectionsCount,
            total_historical_blocked: blockedDetectionsCount
        });
    } catch (err) {
        console.error("Metrics route fallback error:", err.message);
        res.json(metrics.getSummary());
    }
});

module.exports = router;