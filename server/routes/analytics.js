const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

const { verifyToken } = require("../middleware/auth");

const Incident = require("../models/Incident");
const DetectionHistory = require("../models/DetectionHistory");

const metrics = require("../services/metrics");

const logAudit = require("../utils/auditLogger");

// ======================================================
// HELPERS
// ======================================================

function isMongoConnected() {

    return (
        mongoose.connection.readyState === 1
    );

}

// ======================================================
// EMPTY HISTORICAL ANALYTICS
// ======================================================

function getEmptyHistoricalAnalytics() {

    return {

        totalIncidents: 0,

        totalDetections: 0,

        resolved: 0,

        unresolved: 0,

        averageLatency: 0,

        averageConfidence: 0,

        averageEffectiveness: 100,

        mostCommonAttack: "None",

        attackTypes: {},

        severity: {},

        hourly:
            new Array(24).fill(0),

        weekly: [

            { day: "Sun", attacks: 0 },
            { day: "Mon", attacks: 0 },
            { day: "Tue", attacks: 0 },
            { day: "Wed", attacks: 0 },
            { day: "Thu", attacks: 0 },
            { day: "Fri", attacks: 0 },
            { day: "Sat", attacks: 0 }

        ],

        topAttackers: []

    };

}

// ======================================================
// LIVE METRICS
// ======================================================

function getLiveAnalytics() {

    const liveMetrics =
        metrics.getSummary();

    return {

        packetsSent:
            liveMetrics.packets_sent || 0,

        packetsBlocked:
            liveMetrics.packets_blocked || 0,

        attacksDetected:
            liveMetrics.attacks_detected || 0,

        normalTraffic:
            liveMetrics.normal_traffic || 0,

        liveNormal:
            liveMetrics.live_normal || 0,

        liveAttack:
            liveMetrics.live_attack || 0,

        effectiveness:
            liveMetrics.effectiveness_pct ?? 100,

        latency:
            liveMetrics.avg_latency_ms || 0,

        uptime:
            liveMetrics.uptime_seconds || 0

    };

}

// ======================================================
// BUILD USER FILTER
// ======================================================

function getUserFilter(
    role,
    username
) {

    if (role === "admin") {

        return {};

    }

    return {

        username

    };

}

// ======================================================
// GET ANALYTICS
// ======================================================

router.get(
    "/",
    verifyToken,
    async (req, res) => {

        const {
            role,
            username
        } = req.user;

        // ==================================================
        // RESPONSE CACHE CONTROL
        // ==================================================

        res.set({

            "Cache-Control":
                "no-store, no-cache, must-revalidate, proxy-revalidate",

            Pragma:
                "no-cache",

            Expires:
                "0",

            "Surrogate-Control":
                "no-store"

        });

        // ==================================================
        // LIVE DATA
        // ==================================================

        const live =
            getLiveAnalytics();

        let historical =
            getEmptyHistoricalAnalytics();

        let mongoAvailable =
            isMongoConnected();

        // ==================================================
        // MONGODB
        // ==================================================

        if (mongoAvailable) {

            try {

                const filter =
                    getUserFilter(
                        role,
                        username
                    );

                // ==================================================
                // RUN INDEPENDENT DATABASE AGGREGATIONS TOGETHER
                // ==================================================

                const [

                    incidentSummaryResult,

                    attackTypeResult,

                    severityResult,

                    hourlyResult,

                    weeklyResult,

                    attackerResult,

                    detectionSummaryResult

                ] = await Promise.all([

                    // ==================================================
                    // INCIDENT SUMMARY
                    // ==================================================

                    Incident.aggregate([

                        {
                            $match:
                                filter
                        },

                        {
                            $group: {

                                _id:
                                    null,

                                totalIncidents: {
                                    $sum: 1
                                },

                                resolved: {

                                    $sum: {

                                        $cond: [

                                            {
                                                $eq: [
                                                    "$resolved",
                                                    true
                                                ]
                                            },

                                            1,

                                            0

                                        ]

                                    }

                                },

                                unresolved: {

                                    $sum: {

                                        $cond: [

                                            {
                                                $eq: [
                                                    "$resolved",
                                                    true
                                                ]
                                            },

                                            0,

                                            1

                                        ]

                                    }

                                }

                            }

                        }

                    ]),

                    // ==================================================
                    // ATTACK TYPES
                    // ==================================================

                    Incident.aggregate([

                        {
                            $match:
                                filter
                        },

                        {
                            $group: {

                                _id:
                                    "$attackType",

                                count: {
                                    $sum: 1
                                }

                            }

                        },

                        {
                            $sort: {

                                count: -1

                            }

                        }

                    ]),

                    // ==================================================
                    // SEVERITY
                    // ==================================================

                    Incident.aggregate([

                        {
                            $match:
                                filter
                        },

                        {
                            $group: {

                                _id:
                                    "$severity",

                                count: {
                                    $sum: 1
                                }

                            }

                        }

                    ]),

                    // ==================================================
                    // HOURLY ATTACKS
                    //
                    // Today's incidents only.
                    // ==================================================

                    Incident.aggregate([

                        {
                            $match: {

                                ...filter,

                                createdAt: {

                                    $gte:
                                        new Date(
                                            new Date()
                                                .setHours(
                                                    0,
                                                    0,
                                                    0,
                                                    0
                                                )
                                        )

                                }

                            }

                        },

                        {

                            $group: {

                                _id: {

                                    $hour:
                                        "$createdAt"

                                },

                                count: {

                                    $sum: 1

                                }

                            }

                        },

                        {

                            $sort: {

                                "_id": 1

                            }

                        }

                    ]),

                    // ==================================================
                    // WEEKLY ATTACKS
                    //
                    // Current week only.
                    // ==================================================

                    Incident.aggregate([

                        {

                            $match: {

                                ...filter,

                                createdAt: {

                                    $gte:
                                        (() => {

                                            const now =
                                                new Date();

                                            const start =
                                                new Date(
                                                    now
                                                );

                                            start.setHours(
                                                0,
                                                0,
                                                0,
                                                0
                                            );

                                            start.setDate(

                                                now.getDate() -
                                                now.getDay()

                                            );

                                            return start;

                                        })(),

                                    $lt:
                                        (() => {

                                            const now =
                                                new Date();

                                            const start =
                                                new Date(
                                                    now
                                                );

                                            start.setHours(
                                                0,
                                                0,
                                                0,
                                                0
                                            );

                                            start.setDate(

                                                now.getDate() -
                                                now.getDay()

                                            );

                                            const end =
                                                new Date(
                                                    start
                                                );

                                            end.setDate(
                                                start.getDate() +
                                                7
                                            );

                                            return end;

                                        })()

                                }

                            }

                        },

                        {

                            $group: {

                                _id: {

                                    $dayOfWeek:
                                        "$createdAt"

                                },

                                count: {

                                    $sum: 1

                                }

                            }

                        },

                        {

                            $sort: {

                                "_id": 1

                            }

                        }

                    ]),

                    // ==================================================
                    // TOP ATTACKERS
                    // ==================================================

                    Incident.aggregate([

                        {

                            $match: {

                                ...filter,

                                sourceIP: {

                                    $exists:
                                        true,

                                    $nin: [

                                        null,

                                        "",

                                        "unknown"

                                    ]

                                }

                            }

                        },

                        {

                            $group: {

                                _id:
                                    "$sourceIP",

                                attacks: {

                                    $sum: 1

                                }

                            }

                        },

                        {

                            $sort: {

                                attacks: -1

                            }

                        },

                        {

                            $limit: 5

                        }

                    ]),

                    // ==================================================
                    // DETECTION SUMMARY
                    // ==================================================

                    DetectionHistory.aggregate([

                        {

                            $match:
                                filter

                        },

                        {

                            $group: {

                                _id:
                                    null,

                                totalDetections: {

                                    $sum: 1

                                },

                                averageLatency: {

                                    $avg:
                                        "$latencyMs"

                                },

                                averageConfidence: {

                                    $avg:
                                        "$confidence"

                                },

                                blockedCount: {

                                    $sum: {

                                        $cond: [

                                            {

                                                $eq: [

                                                    "$decision",

                                                    "Blocked"

                                                ]

                                            },

                                            1,

                                            0

                                        ]

                                    }

                                }

                            }

                        }

                    ])

                ]);

                // ==================================================
                // INCIDENT SUMMARY
                // ==================================================

                const incidentSummary =
                    incidentSummaryResult[0] ||
                    {

                        totalIncidents: 0,

                        resolved: 0,

                        unresolved: 0

                    };

                // ==================================================
                // DETECTION SUMMARY
                // ==================================================

                const detectionSummary =
                    detectionSummaryResult[0] ||
                    {

                        totalDetections: 0,

                        averageLatency: 0,

                        averageConfidence: 0,

                        blockedCount: 0

                    };

                // ==================================================
                // ATTACK TYPES
                // ==================================================

                const attackTypes = {};

                attackTypeResult.forEach(
                    item => {

                        attackTypes[
                            item._id ||
                            "Unknown"
                        ] =
                            item.count;

                    }
                );

                // ==================================================
                // SEVERITY
                // ==================================================

                const severity = {};

                severityResult.forEach(
                    item => {

                        severity[
                            item._id ||
                            "medium"
                        ] =
                            item.count;

                    }
                );

                // ==================================================
                // HOURLY
                // ==================================================

                const hourly =
                    new Array(24).fill(0);

                hourlyResult.forEach(
                    item => {

                        const hour =
                            Number(
                                item._id
                            );

                        if (
                            hour >= 0 &&
                            hour <= 23
                        ) {

                            hourly[hour] =
                                item.count;

                        }

                    }
                );

                // ==================================================
                // WEEKLY
                //
                // MongoDB $dayOfWeek:
                //
                // Sunday = 1
                // Monday = 2
                // ...
                // Saturday = 7
                // ==================================================

                const weeklyCounts =
                    new Array(7).fill(0);

                weeklyResult.forEach(
                    item => {

                        const mongoDay =
                            Number(
                                item._id
                            );

                        if (
                            mongoDay >= 1 &&
                            mongoDay <= 7
                        ) {

                            weeklyCounts[
                                mongoDay - 1
                            ] =
                                item.count;

                        }

                    }
                );

                // ==================================================
                // TOP ATTACKERS
                // ==================================================

                const topAttackers =
                    attackerResult.map(
                        item => ({

                            ip:
                                item._id,

                            attacks:
                                item.attacks

                        })
                    );

                // ==================================================
                // AVERAGE LATENCY
                // ==================================================

                const rawAverageLatency =
                    Number(
                        detectionSummary.averageLatency
                    );

                const averageLatency =
                    Number.isFinite(
                        rawAverageLatency
                    )

                        ? Number(
                            rawAverageLatency.toFixed(2)
                        )

                        : 0;

                // ==================================================
                // AVERAGE CONFIDENCE
                // ==================================================

                const rawAverageConfidence =
                    Number(
                        detectionSummary.averageConfidence
                    );

                let averageConfidence = 0;

                if (
                    Number.isFinite(
                        rawAverageConfidence
                    )
                ) {

                    averageConfidence =
                        Number(

                            (
                                rawAverageConfidence <= 1

                                    ? rawAverageConfidence * 100

                                    : rawAverageConfidence

                            ).toFixed(2)

                        );

                }

                // ==================================================
                // EFFECTIVENESS
                // ==================================================

                const totalDetections =
                    Number(
                        detectionSummary.totalDetections
                    ) || 0;

                const blockedCount =
                    Number(
                        detectionSummary.blockedCount
                    ) || 0;

                const averageEffectiveness =
                    totalDetections > 0

                        ? Number(

                            (
                                (
                                    blockedCount /
                                    totalDetections
                                ) *
                                100

                            ).toFixed(1)

                        )

                        : 100;

                // ==================================================
                // MOST COMMON ATTACK
                // ==================================================

                const mostCommonAttack =
                    attackTypeResult[0]?._id ||
                    "None";

                // ==================================================
                // BUILD HISTORICAL ANALYTICS
                // ==================================================

                historical = {

                    totalIncidents:
                        Number(
                            incidentSummary.totalIncidents
                        ) || 0,

                    totalDetections,

                    resolved:
                        Number(
                            incidentSummary.resolved
                        ) || 0,

                    unresolved:
                        Number(
                            incidentSummary.unresolved
                        ) || 0,

                    averageLatency,

                    averageConfidence,

                    averageEffectiveness,

                    mostCommonAttack,

                    attackTypes,

                    severity,

                    hourly,

                    weekly: [

                        {
                            day:
                                "Sun",

                            attacks:
                                weeklyCounts[0]

                        },

                        {
                            day:
                                "Mon",

                            attacks:
                                weeklyCounts[1]

                        },

                        {
                            day:
                                "Tue",

                            attacks:
                                weeklyCounts[2]

                        },

                        {
                            day:
                                "Wed",

                            attacks:
                                weeklyCounts[3]

                        },

                        {
                            day:
                                "Thu",

                            attacks:
                                weeklyCounts[4]

                        },

                        {
                            day:
                                "Fri",

                            attacks:
                                weeklyCounts[5]

                        },

                        {
                            day:
                                "Sat",

                            attacks:
                                weeklyCounts[6]

                        }

                    ],

                    topAttackers

                };

            }

            catch (err) {

                mongoAvailable = false;

                console.error(
                    "⚠️ Analytics MongoDB query failed:",
                    err.message
                );

                historical =
                    getEmptyHistoricalAnalytics();

            }

        }

        // ==================================================
        // FINAL RESPONSE
        // ==================================================

        const response = {

            success: true,

            mongoAvailable,

            // Historical MongoDB data

            ...historical,

            // Live runtime data

            live

        };

        // ==================================================
        // AUDIT
        // ==================================================

        /*
         * Audit logging is deliberately isolated.
         *
         * Even if the audit collection/database operation
         * is slow, analytics data has already been prepared.
         */

        logAudit({

            username,

            role,

            action:
                "Viewed Analytics",

            description:
                `Viewed analytics. MongoDB available: ${mongoAvailable}`,

            ipAddress:
                req.ip,

            status:
                "Success"

        }).catch(err => {

            console.log(
                "Audit logging failed:",
                err.message
            );

        });

        // ==================================================
        // SEND RESPONSE
        // ==================================================

        return res.json(
            response
        );

    }
);

module.exports = router;