const express = require("express");

const router = express.Router();

const {
    verifyToken
} = require("../middleware/auth");

const DetectionHistory =
    require("../models/DetectionHistory");

const logAudit =
    require("../utils/auditLogger");

// ======================================================
// GET DETECTION HISTORY
// ======================================================

router.get(

    "/",

    verifyToken,

    async (req, res, next) => {

        try {

            const {
                role,
                username
            } = req.user;

            const filter =

                role === "admin"

                    ? {}

                    : {

                        $or: [

                            {
                                username
                            },

                            {
                                username: "simulator"
                            }

                        ]

                    };

            const history =
                await DetectionHistory.getAll(
                    filter
                );

            await logAudit({

                username,

                role,

                action:
                    "Viewed Detection History",

                description:
                    `Viewed ${history.length} detection records`,

                ipAddress:
                    req.ip,

                status:
                    "Success"

            });

            res.json({

                success: true,

                totalRecords:
                    history.length,

                history

            });

        }

        catch (err) {

            next(err);

        }

    }

);

module.exports = router;