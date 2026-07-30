const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
    {

        // ======================================================
        // USER INFORMATION
        // ======================================================

        userId: {
            type: String,
            default: "unknown",
            index: true
        },

        username: {
            type: String,
            default: "unknown",
            index: true
        },

        // ======================================================
        // ATTACK INFORMATION
        // ======================================================

        attackType: {

            type: String,

            enum: [
                "SYN Flood",
                "UDP Flood",
                "HTTP Flood",
                "Generic DDoS",
                "Unknown"
            ],

            default: "Generic DDoS"

        },

        severity: {

            type: String,

            enum: [
                "low",
                "medium",
                "high",
                "critical"
            ],

            default: "medium"

        },

        sourceIP: {

            type: String,

            default: "unknown"

        },

        // ======================================================
        // TRAFFIC DATA
        // ======================================================

        trafficData: {

            packetRate: {
                type: Number,
                default: 0
            },

            duration: {
                type: Number,
                default: 0
            },

            byteCount: {
                type: Number,
                default: 0
            }

        },

        // ======================================================
        // DETECTION INFORMATION
        // ======================================================

        detection: {

            mlScore: {

                type: Number,

                default: 0

            },

            heuristicScore: {

                type: Number,

                default: 0

            },

            anomalyScore: {

                type: Number,

                default: 0

            },

            ensembleScore: {

                type: Number,

                default: 0

            },

            confidence: {

                type: Number,

                default: 0

            },

            latencyMs: {

                type: Number,

                default: 0

            }

        },

        // ======================================================
        // MITIGATION
        // ======================================================

        mitigation: {

            actionsTaken: {

                type: [String],

                default: []

            },

            ipBlocked: {

                type: Boolean,

                default: true

            },

            effectivenessPct: {

                type: Number,

                default: 99.2

            }

        },

        // ======================================================
        // RECOMMENDATIONS
        // ======================================================

        recommendations: {

            type: [String],

            default: []

        },

        // ======================================================
        // SOURCE
        // ======================================================

        source: {

            type: String,

            enum: [
                "manual",
                "simulator"
            ],

            default: "manual",

            index: true

        },

        // ======================================================
        // RESOLUTION
        // ======================================================

        resolved: {

            type: Boolean,

            default: false,

            index: true

        },

        resolvedAt: {

            type: Date,

            default: null

        },

        resolvedBy: {

            type: String,

            default: null

        }

    },

    {

        timestamps: true

    }
);

// ======================================================
// INDEXES
// ======================================================

incidentSchema.index({
    createdAt: -1
});

incidentSchema.index({
    username: 1,
    createdAt: -1
});

incidentSchema.index({
    source: 1,
    createdAt: -1
});

incidentSchema.index({
    attackType: 1,
    createdAt: -1
});

incidentSchema.index({
    severity: 1,
    createdAt: -1
});

incidentSchema.index({
    sourceIP: 1,
    createdAt: -1
});

// ======================================================
// CREATE INCIDENT
// ======================================================

incidentSchema.statics.createIncident =
    async function(data) {

        if (
            mongoose.connection.readyState !== 1
        ) {

            throw new Error(
                "MongoDB is not connected. Incident was not saved."
            );

        }

        const doc =
            new this(data);

        return await doc.save();

    };

// ======================================================
// GET ALL INCIDENTS
// ======================================================

incidentSchema.statics.getAll =
    async function(filter = {}) {

        if (
            mongoose.connection.readyState !== 1
        ) {

            throw new Error(
                "MongoDB is not connected."
            );

        }

        return await this.find(filter)
            .sort({
                createdAt: -1
            })
            .lean();

    };

// ======================================================
// GET INCIDENTS WITH LIMIT
// ======================================================

incidentSchema.statics.getRecent =
    async function(
        filter = {},
        limit = 500
    ) {

        if (
            mongoose.connection.readyState !== 1
        ) {

            throw new Error(
                "MongoDB is not connected."
            );

        }

        return await this.find(filter)
            .sort({
                createdAt: -1
            })
            .limit(limit)
            .lean();

    };

// ======================================================
// FIND INCIDENT BY ID
// ======================================================

incidentSchema.statics.getById =
    async function(id) {

        if (
            mongoose.connection.readyState !== 1
        ) {

            throw new Error(
                "MongoDB is not connected."
            );

        }

        return await this.findById(id)
            .lean();

    };

// ======================================================
// RESOLVE SINGLE INCIDENT
// ======================================================

incidentSchema.statics.resolveIncident =
    async function(
        id,
        username
    ) {

        if (
            mongoose.connection.readyState !== 1
        ) {

            throw new Error(
                "MongoDB is not connected."
            );

        }

        return await this.findByIdAndUpdate(

            id,

            {

                resolved: true,

                resolvedAt:
                    new Date(),

                resolvedBy:
                    username

            },

            {

                new: true

            }

        );

    };

// ======================================================
// RESOLVE ALL ACTIVE INCIDENTS
// ======================================================

incidentSchema.statics.resolveAll =
    async function(username) {

        if (
            mongoose.connection.readyState !== 1
        ) {

            throw new Error(
                "MongoDB is not connected."
            );

        }

        return await this.updateMany(

            {
                resolved: false
            },

            {

                $set: {

                    resolved: true,

                    resolvedAt:
                        new Date(),

                    resolvedBy:
                        username

                }

            }

        );

    };

module.exports =
    mongoose.model(
        "Incident",
        incidentSchema
    );