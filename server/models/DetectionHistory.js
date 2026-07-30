const mongoose = require("mongoose");

const DetectionHistorySchema =
    new mongoose.Schema(

        {

            sourceIP: {

                type: String,

                required: true

            },

            attackType: {

                type: String,

                required: true

            },

            isAttack: {

                type: Boolean,

                required: true

            },

            confidence: {

                type: Number,

                required: true

            },

            latencyMs: {

                type: Number,

                required: true

            },

            decision: {

                type: String,

                enum: [
                    "Allowed",
                    "Blocked"
                ],

                required: true

            },

            username: {

                type: String,

                default: "simulator"

            }

        },

        {

            timestamps: true

        }

    );

// ======================================================
// INDEXES
// ======================================================

DetectionHistorySchema.index({

    createdAt: -1

});

DetectionHistorySchema.index({

    username: 1,

    createdAt: -1

});

DetectionHistorySchema.index({

    isAttack: 1,

    createdAt: -1

});

// ======================================================
// CREATE ENTRY
// ======================================================

DetectionHistorySchema.statics.createEntry =
    async function(data) {

        if (
            mongoose.connection.readyState !== 1
        ) {

            throw new Error(
                "MongoDB is not connected. Detection history was not saved."
            );

        }

        return await this.create(data);

    };

// ======================================================
// GET ALL
// ======================================================

DetectionHistorySchema.statics.getAll =
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

            .limit(500)

            .lean();

    };

module.exports =
    mongoose.model(
        "DetectionHistory",
        DetectionHistorySchema
    );