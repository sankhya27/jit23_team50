const express = require("express");
const router = express.Router();

const {
    startSimulation,
    stopSimulation,
    addSSEClient,
    removeSSEClient,
    isRunning
} = require("../services/simulator");

const { verifyToken } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

// ===================================================
// START SIMULATION (ADMIN ONLY)
// ===================================================

router.post(
    "/start",
    verifyToken,
    validate("simulate"),
    (req, res) => {

        if (req.user.role !== "admin") {

            return res.status(403).json({

                error: "Only administrators can start simulations."

            });

        }

        const { attack_type } = req.body;

        if (isRunning()) {

            return res.status(400).json({

                error: "Simulation already running."

            });

        }

        startSimulation(

            attack_type || "random",

            req.user.username

        );

        res.json({

            success: true,

            message: "Simulation started."

        });

    }
);

// ===================================================
// STOP SIMULATION (ADMIN ONLY)
// ===================================================

router.post(
    "/stop",
    verifyToken,
    (req, res) => {

        if (req.user.role !== "admin") {

            return res.status(403).json({

                error: "Only administrators can stop simulations."

            });

        }

        if (!isRunning()) {

            return res.status(400).json({

                error: "Simulation is not running."

            });

        }

        stopSimulation();

        res.json({

            success: true,

            message: "Simulation stopped."

        });

    }
);

// ===================================================
// LIVE SSE STREAM
// ===================================================

router.get("/stream", (req, res) => {

    res.setHeader(

        "Content-Type",

        "text/event-stream"

    );

    res.setHeader(

        "Cache-Control",

        "no-cache"

    );

    res.setHeader(

        "Connection",

        "keep-alive"

    );

    res.flushHeaders();

    addSSEClient(res);

    res.write(

        `data: ${JSON.stringify({

            connected: true,

            running: isRunning()

        })}\n\n`

    );

    req.on("close", () => {

        removeSSEClient(res);

    });

});

module.exports = router;