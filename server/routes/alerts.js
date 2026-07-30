const express = require("express");

const router = express.Router();

const { verifyToken } = require("../middleware/auth");

const metrics = require("../services/metrics");

const Incident = require("../models/Incident");

const logAudit = require("../utils/auditLogger");

// ======================================================
// GET ALERTS
// ======================================================

router.get(

    "/",

    verifyToken,

    async (req, res, next) => {

        try {

            const incidents = await Incident.getAll({});

            const summary = metrics.getSummary();

            const alerts = [];

            incidents

                .sort(

                    (a, b) =>

                        new Date(b.createdAt) -

                        new Date(a.createdAt)

                )

                .slice(0, 15)

                .forEach((incident) => {

                    alerts.push({

                        id: incident._id || incident.id,

                        title:

                            `${incident.attackType || "Unknown Attack"} Detected`,

                        message:

                            `Traffic from ${incident.sourceIP || "Unknown"} exceeded security thresholds.`,

                        severity:

                            incident.severity || "medium",

                        priority:

                            incident.severity === "critical"

                                ? "P1"

                                : incident.severity === "high"

                                ? "P2"

                                : incident.severity === "medium"

                                ? "P3"

                                : "P4",

                        category:

                            "Network Security",

                        status:

                            incident.resolved

                                ? "Resolved"

                                : "Active",

                        attackType:

                            incident.attackType,

                        sourceIP:

                            incident.sourceIP,

                        createdAt:

                            incident.createdAt

                    });

                });

            if (summary.attacks_detected > 0) {

                alerts.unshift({

                    id: "live-summary",

                    title: "Live Security Monitoring",

                    message:

                        `${summary.attacks_detected} attacks detected. ${summary.packets_blocked} malicious packets blocked.`,

                    severity: "high",

                    priority: "P1",

                    category: "SOC",

                    status: "Monitoring",

                    createdAt: new Date().toISOString()

                });

            }

            await logAudit({

                username: req.user.username,

                role: req.user.role,

                action: "Viewed Alerts",

                description:

                    `Viewed ${alerts.length} security alerts`,

                ipAddress: req.ip,

                status: "Success"

            });

            res.json({

                success: true,

                totalAlerts: alerts.length,

                alerts

            });

        }

        catch (err) {

            next(err);

        }

    }

);

module.exports = router;