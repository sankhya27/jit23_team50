require("dotenv").config();

// ======================================================
// DNS
// ======================================================

const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

// ======================================================
// DEPENDENCIES
// ======================================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

// ======================================================
// ROUTES
// ======================================================

const systemHealthRoutes =
    require("./routes/systemHealth");

const authRoutes =
    require("./routes/auth");

const predictRoutes =
    require("./routes/predict");

const simulateRoutes =
    require("./routes/simulate");

const metricsRoutes =
    require("./routes/metrics");

const incidentsRoutes =
    require("./routes/incidents");

const historyRoutes =
    require("./routes/history");

const usersRoutes =
    require("./routes/users");

const datasetsRoutes =
    require("./routes/datasets");

const assistantRoutes =
    require("./routes/assistant");

const reportsRoutes =
    require("./routes/reports");

const analyticsRoutes =
    require("./routes/analytics");

const alertsRoutes =
    require("./routes/alerts");

const alertPreferencesRoutes =
    require("./routes/alertPreferences");

const errorHandler =
    require("./middleware/errorHandler");

// ======================================================
// APP
// ======================================================

const app = express();

const PORT =
    process.env.PORT || 5001;

const MONGO_URI =
    process.env.MONGO_URI || "";

// ======================================================
// SECURITY & MIDDLEWARE
// ======================================================

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173"
        ],
        credentials: true
    })
);

app.use(morgan("dev"));

app.use(
    express.json({
        limit: "1mb"
    })
);

// ======================================================
// SYSTEM HEALTH
// ======================================================

app.use(
    "/api/system-health",
    systemHealthRoutes
);

// ======================================================
// HEALTH
// ======================================================

app.get(
    "/api/health",
    (_req, res) => {

        res.json({

            status: "ok",

            mongodb:
                mongoose.connection.readyState === 1
                    ? "connected"
                    : "disconnected",

            time: new Date()

        });

    }
);

// ======================================================
// DATABASE CONNECTION
// ======================================================

async function connectDatabase() {

    if (!MONGO_URI) {

        throw new Error(
            "MONGO_URI is not configured."
        );

    }

    // --------------------------------------------------
    // MongoDB connection events
    // --------------------------------------------------

    mongoose.connection.on(
        "connected",
        () => {

            console.log(
                "✅ MongoDB connection established."
            );

        }
    );

    mongoose.connection.on(
        "error",
        (err) => {

            console.error(
                "❌ MongoDB connection error:",
                err.message
            );

        }
    );

    mongoose.connection.on(
        "disconnected",
        () => {

            console.warn(
                "⚠️ MongoDB disconnected. Mongoose will attempt to reconnect."
            );

        }
    );

    mongoose.connection.on(
        "reconnected",
        () => {

            console.log(
                "🔄 MongoDB reconnected successfully."
            );

        }
    );

    // --------------------------------------------------
    // Connect to MongoDB Atlas
    // --------------------------------------------------

    await mongoose.connect(
        MONGO_URI,
        {

            // Don't allow requests to wait forever
            // when MongoDB cannot be reached.
            serverSelectionTimeoutMS: 5000,

            // Initial connection timeout.
            connectTimeoutMS: 5000,

            // Allow the driver to detect broken sockets
            // and recover them.
            socketTimeoutMS: 30000,

            // Send regular heartbeat checks.
            heartbeatFrequencyMS: 10000,

            // Connection pool.
            maxPoolSize: 10,
            minPoolSize: 1,

            // Retry temporary network failures.
            retryReads: true,
            retryWrites: true

        }
    );

}

// ======================================================
// ROUTES
// ======================================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/predict",
    predictRoutes
);

app.use(
    "/api/simulate",
    simulateRoutes
);

app.use(
    "/api/metrics",
    metricsRoutes
);

app.use(
    "/api/incidents",
    incidentsRoutes
);

app.use(
    "/api/history",
    historyRoutes
);

app.use(
    "/api/users",
    usersRoutes
);

app.use(
    "/api/datasets",
    datasetsRoutes
);

app.use(
    "/api/assistant",
    assistantRoutes
);

app.use(
    "/api/reports",
    reportsRoutes
);

app.use(
    "/api/analytics",
    analyticsRoutes
);

app.use(
    "/api/alerts",
    alertsRoutes
);

app.use(
    "/api/alert-preferences",
    alertPreferencesRoutes
);

// ======================================================
// ERROR HANDLER
// ======================================================

app.use(errorHandler);

// ======================================================
// START SERVER ONLY AFTER DATABASE IS READY
// ======================================================

async function startServer() {

    try {

        console.log(
            "Connecting to MongoDB..."
        );

        await connectDatabase();

        console.log(
            "✅ MongoDB ready."
        );

        app.listen(
            PORT,
            () => {

                console.log("");

                console.log(
                    "===================================="
                );

                console.log(
                    `🚀 DDoS Guard API running on http://localhost:${PORT}`
                );

                console.log(
                    "📊 MongoDB: Connected"
                );

                console.log(
                    `🤖 ML Microservice expected at ${
                        process.env.ML_SERVICE_URL ||
                        "http://localhost:5000"
                    }`
                );

                console.log(
                    "===================================="
                );

                console.log("");

            }
        );

    }

    catch (err) {

        console.error("");

        console.error(
            "===================================="
        );

        console.error(
            "❌ BACKEND STARTUP FAILED"
        );

        console.error(
            "===================================="
        );

        console.error(
            err.message
        );

        console.error("");

        console.error(
            "The server will NOT start because MongoDB is unavailable."
        );

        console.error(
            "This prevents simulation data from silently disappearing."
        );

        process.exit(1);

    }

}

// ======================================================
// START
// ======================================================

startServer();

module.exports = app;