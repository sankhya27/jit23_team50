const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

const {
    isRunning
} = require("../services/simulator");

router.get("/", async (req, res) => {

    const simulationRunning = isRunning();

    const health = {

        api: "Online",

        mongodb:
            mongoose.connection.readyState === 1
                ? "Connected"
                : "Disconnected",

        ml: "Online",

        email: "Online",

        simulation:
            simulationRunning
                ? "Running"
                : "Stopped",

        simulation_running:
            simulationRunning,

        timestamp: new Date()

    };

    res.json(health);

});

module.exports = router;