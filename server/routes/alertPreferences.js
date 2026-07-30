const express = require("express");

const router = express.Router();

const { verifyToken } = require("../middleware/auth");

const AlertPreference = require("../models/AlertPreference");

const { sendTestAlert } = require("../utils/mailService");

// ======================================================
// GET SETTINGS (ALL USERS)
// ======================================================

router.get("/", verifyToken, async (req, res, next) => {

    try {

        let preferences = await AlertPreference.findOne({

            username: req.user.username

        });

        if (!preferences) {

            preferences = await AlertPreference.create({

                username: req.user.username,

                email: "",

                enabled: true

            });

        }

        res.json({

            status: "success",

            preferences

        });

    }

    catch (err) {

        next(err);

    }

});

// ======================================================
// SAVE SETTINGS (ADMIN ONLY)
// ======================================================

router.post("/", verifyToken, async (req, res, next) => {

    try {

        if (req.user.role !== "admin") {

            return res.status(403).json({

                status: "error",

                message: "Only administrators can modify alert settings."

            });

        }

        const {

            email,

            enabled

        } = req.body;

        const preferences = await AlertPreference.findOneAndUpdate(

            {

                username: req.user.username

            },

            {

                email,

                enabled

            },

            {

                new: true,

                upsert: true

            }

        );

        res.json({

            status: "success",

            preferences

        });

    }

    catch (err) {

        next(err);

    }

});

// ======================================================
// SEND TEST EMAIL (ADMIN ONLY)
// ======================================================

router.post("/test", verifyToken, async (req, res, next) => {

    try {

        if (req.user.role !== "admin") {

            return res.status(403).json({

                status: "error",

                message: "Only administrators can send test alerts."

            });

        }

        const preferences = await AlertPreference.findOne({

            username: req.user.username

        });

        if (!preferences || !preferences.email) {

            return res.status(400).json({

                status: "error",

                message: "Please save an email address first."

            });

        }

        await sendTestAlert(preferences.email);

        res.json({

            status: "success",

            message: `Test alert sent successfully to ${preferences.email}`

        });

    }

    catch (err) {

        next(err);

    }

});

module.exports = router;