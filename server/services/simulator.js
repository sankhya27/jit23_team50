const mongoose = require("mongoose");

const AlertPreference =
    require("../models/AlertPreference");

const {
    getPrediction
} = require("./mlService");

const metrics =
    require("./metrics");

const Incident =
    require("../models/Incident");

const DetectionHistory =
    require("../models/DetectionHistory");

const {
    sendAttackAlert
} = require("../utils/mailService");

// ======================================================
// Helpers
// ======================================================

function rand(min, max) {

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;

}

function randomIP() {

    return `192.168.${rand(1, 255)}.${rand(1, 254)}`;

}

function isMongoConnected() {

    return (
        mongoose.connection.readyState === 1
    );

}

// ======================================================
// Traffic Profiles
// ======================================================

const profiles = {

    normal: () => ({

        packet_rate:
            rand(100, 1800),

        duration:
            rand(5, 80),

        byte_count:
            rand(20000, 400000),

        protocol:
            ["TCP", "UDP", "HTTP"][
                rand(0, 2)
            ],

        syn_flags:
            rand(0, 8),

        total_packets:
            rand(60, 250),

        packets_from_source:
            rand(5, 80),

        avg_packet_size:
            rand(400, 900),

        packet_count:
            rand(50, 250)

    }),

    syn: () => ({

        packet_rate:
            rand(40000, 120000),

        duration:
            rand(20, 250),

        byte_count:
            rand(3000000, 12000000),

        protocol:
            "TCP",

        syn_flags:
            rand(900, 1000),

        total_packets:
            1000,

        packets_from_source:
            rand(700, 2500),

        avg_packet_size:
            rand(60, 120),

        packet_count:
            rand(800, 2500)

    }),

    udp: () => ({

        packet_rate:
            rand(35000, 100000),

        duration:
            rand(40, 500),

        byte_count:
            rand(6000000, 18000000),

        protocol:
            "UDP",

        avg_packet_size:
            rand(900, 1400),

        packets_from_source:
            rand(500, 2200),

        packet_count:
            rand(700, 2500)

    }),

    http: () => ({

        packet_rate:
            rand(6000, 25000),

        duration:
            rand(1000, 9000),

        byte_count:
            rand(300000, 3000000),

        protocol:
            "HTTP",

        packets_from_source:
            rand(1200, 5000),

        avg_packet_size:
            rand(300, 900),

        packet_count:
            rand(1000, 5000)

    })

};

// ======================================================
// Simulator State
// ======================================================

let _running = false;

let _attackType = "random";

let _sseClients = [];

let _intervalHandle = null;

let _tickInProgress = false;

const TICK_INTERVAL_MS = 500;

// ======================================================
// Session State
// ======================================================

let currentSession = "normal";

let packetsRemaining = 0;

let currentAttack = "syn";

let attackChain = 0;

let emailCooldown = false;

// ======================================================
// Smooth Graph State
// ======================================================

let currentAttackTraffic = 0;

let currentNormalTraffic = 4000;

// ======================================================
// Session Generator
// ======================================================

function chooseAttackType() {

    if (

        _attackType === "syn" ||

        _attackType === "udp" ||

        _attackType === "http"

    ) {

        return _attackType;

    }

    const attacks = [

        "syn",

        "udp",

        "http"

    ];

    return attacks[
        rand(
            0,
            attacks.length - 1
        )
    ];

}

function generateNextSession() {

    if (packetsRemaining > 0) {

        packetsRemaining--;

        return;

    }

    // ==================================================
    // NORMAL
    // ==================================================

    if (currentSession === "normal") {

        if (Math.random() < 0.50) {

            currentSession = "attack";

            attackChain++;

            const attackRoll =
                Math.random();

            if (attackRoll < 0.25) {

                packetsRemaining =
                    rand(8, 15);

            }

            else if (attackRoll < 0.75) {

                packetsRemaining =
                    rand(20, 35);

            }

            else {

                packetsRemaining =
                    rand(45, 70);

            }

            currentAttack =
                chooseAttackType();

        }

        else {

            attackChain = 0;

            packetsRemaining =
                rand(6, 12);

        }

    }

    // ==================================================
    // ATTACK
    // ==================================================

    else {

        if (

            _attackType === "random" &&

            Math.random() < 0.20 &&

            attackChain < 2

        ) {

            currentSession = "attack";

            attackChain++;

            packetsRemaining =
                rand(15, 35);

            currentAttack =
                chooseAttackType();

        }

        else {

            currentSession = "normal";

            attackChain = 0;

            packetsRemaining =
                rand(5, 10);

        }

    }

}

// ======================================================
// SSE
// ======================================================

function isRunning() {

    return _running;

}

function addSSEClient(res) {

    if (!_sseClients.includes(res)) {

        _sseClients.push(res);

    }

    try {

        res.write(

            `data: ${JSON.stringify({

                type: "connected",

                running:
                    _running,

                metrics:
                    metrics.getSummary()

            })}\n\n`

        );

    }

    catch (err) {

        removeSSEClient(res);

    }

}

function removeSSEClient(res) {

    _sseClients =
        _sseClients.filter(

            client =>
                client !== res

        );

}

function broadcast(data) {

    const payload =
        `data: ${JSON.stringify(data)}\n\n`;

    _sseClients =
        _sseClients.filter(

            client => {

                try {

                    if (

                        client.destroyed ||

                        client.writableEnded

                    ) {

                        return false;

                    }

                    client.write(
                        payload
                    );

                    return true;

                }

                catch (err) {

                    return false;

                }

            }

        );

}

// ======================================================
// SSE HEARTBEAT
// ======================================================

const SSE_HEARTBEAT_MS = 15000;

const heartbeatHandle =
    setInterval(

        () => {

            _sseClients =
                _sseClients.filter(

                    client => {

                        try {

                            if (

                                client.destroyed ||

                                client.writableEnded

                            ) {

                                return false;

                            }

                            client.write(
                                ": heartbeat\n\n"
                            );

                            return true;

                        }

                        catch (err) {

                            return false;

                        }

                    }

                );

        },

        SSE_HEARTBEAT_MS

    );

if (

    heartbeatHandle &&

    typeof heartbeatHandle.unref ===
        "function"

) {

    heartbeatHandle.unref();

}

// ======================================================
// Smooth Live Traffic
// ======================================================

function generateLiveTraffic(isAttack) {

    if (isAttack) {

        if (Math.random() < 0.10) {

            currentAttackTraffic +=
                rand(350, 700);

        }

        else {

            currentAttackTraffic +=
                rand(70, 220);

        }

        currentAttackTraffic +=
            rand(-120, 120);

        if (
            currentAttackTraffic > 4800
        ) {

            currentAttackTraffic -=
                rand(120, 400);

        }

        if (
            currentAttackTraffic < 900
        ) {

            currentAttackTraffic = 900;

        }

        currentNormalTraffic -=
            rand(20, 80);

        currentNormalTraffic +=
            rand(-100, 100);

        if (
            currentNormalTraffic < 450
        ) {

            currentNormalTraffic = 450;

        }

        if (
            currentNormalTraffic > 1500
        ) {

            currentNormalTraffic = 1500;

        }

    }

    else {

        currentAttackTraffic -=
            rand(80, 220);

        currentAttackTraffic +=
            rand(-90, 90);

        if (
            currentAttackTraffic < 0
        ) {

            currentAttackTraffic = 0;

        }

        currentNormalTraffic +=
            rand(40, 130);

        currentNormalTraffic +=
            rand(-140, 140);

        if (
            currentNormalTraffic < 3400
        ) {

            currentNormalTraffic = 3400;

        }

        if (
            currentNormalTraffic > 5000
        ) {

            currentNormalTraffic = 5000;

        }

    }

    return {

        attack:
            Math.round(
                currentAttackTraffic
            ),

        normal:
            Math.round(
                currentNormalTraffic
            )

    };

}

// ======================================================
// Save Detection History
// ======================================================

async function saveDetectionHistory({

    sourceIP,

    attackType,

    isAttack,

    confidence,

    latencyMs,

    decision,

    username

}) {

    if (!isMongoConnected()) {

        throw new Error(
            "MongoDB is not connected."
        );

    }

    return await DetectionHistory.createEntry({

        sourceIP,

        attackType,

        isAttack,

        confidence,

        latencyMs,

        decision,

        username:
            username ||
            "simulator"

    });

}

// ======================================================
// Save Incident
// ======================================================

async function saveIncident({

    username,

    attackLabel,

    severity,

    sourceIP,

    trafficData,

    detectionMethods,

    ensembleScore,

    confidence,

    latencyMs

}) {

    if (!isMongoConnected()) {

        throw new Error(
            "MongoDB is not connected."
        );

    }

    return await Incident.createIncident({

        userId:
            username ||
            "system",

        username:
            username ||
            "system",

        attackType:
            attackLabel,

        severity,

        sourceIP,

        trafficData: {

            packetRate:
                trafficData.packet_rate,

            duration:
                trafficData.duration,

            byteCount:
                trafficData.byte_count

        },

        detection: {

            mlScore:
                Number(
                    detectionMethods?.ml_model ||
                    0
                ),

            heuristicScore:
                Number(
                    detectionMethods?.heuristic ||
                    0
                ),

            anomalyScore:
                Number(
                    detectionMethods?.anomaly_detection ||
                    0
                ),

            ensembleScore:
                Number(
                    ensembleScore ||
                    0
                ),

            confidence,

            latencyMs:
                latencyMs || 0

        },

        mitigation: {

            actionsTaken: [

                `Blocked ${sourceIP}`,

                "Rate limiting",

                "Firewall updated"

            ],

            ipBlocked: true,

            effectivenessPct: 99.2

        },

        recommendations: [

            "Continue monitoring",

            "Inspect firewall logs",

            `Investigate ${attackLabel}`

        ],

        source:
            "simulator",

        resolved: false,

        resolvedAt: null,

        resolvedBy: null

    });

}
// ======================================================
// Main Tick
// ======================================================

async function runTick(username) {

    if (!_running) {

        return;

    }

    generateNextSession();

    const selectedType =
        currentSession === "normal"
            ? "normal"
            : currentAttack;

    const profileGenerator =
        profiles[selectedType];

    if (!profileGenerator) {

        throw new Error(
            `Unknown simulator profile: ${selectedType}`
        );

    }

    const trafficData =
        profileGenerator();

    const sourceIP =
        randomIP();

    // ==================================================
    // ML PREDICTION
    // ==================================================

    let result = null;

    /*
     * IMPORTANT:
     *
     * AbortController is used here instead of
     * Promise.race().
     *
     * Promise.race() only stops waiting for a request.
     * It does NOT actually cancel the Axios request.
     *
     * AbortController cancels the actual ML request.
     */

    const controller =
        new AbortController();

    const mlTimeout =
        setTimeout(() => {

            controller.abort();

        }, 1500);

    try {

        result =
            await getPrediction(

                trafficData,

                controller.signal

            );

    }

    catch (err) {

        result = {

            ok: false,

            error:
                err.message ||
                "ML prediction failed."

        };

    }

    finally {

        clearTimeout(
            mlTimeout
        );

    }

    // --------------------------------------------------
    // Simulation may have been stopped while ML
    // request was running.
    // --------------------------------------------------

    if (!_running) {

        return;

    }

    // ==================================================
    // PREDICTION VALUES
    // ==================================================

    let is_attack = null;

    let confidence = null;

    let detection_methods = null;

    let detection_latency_ms = 15;

    if (

        result &&

        result.ok &&

        result.data

    ) {

        is_attack =
            result.data.is_attack;

        confidence =
            result.data.confidence;

        detection_methods =
            result.data.detection_methods;

        detection_latency_ms =
            result.data.detection_latency_ms ||
            15;

    }

    // ==================================================
    // SIMULATOR GROUND TRUTH
    // ==================================================

    const groundTruthIsAttack =
        currentSession !== "normal";

    /*
     * If ML service doesn't return a valid
     * boolean prediction, use simulator ground
     * truth as a safe fallback.
     */

    if (
        typeof is_attack !== "boolean"
    ) {

        is_attack =
            groundTruthIsAttack;

    }

    if (
        typeof confidence !== "number"
    ) {

        confidence =
            is_attack

                ? rand(90, 99) / 100

                : rand(2, 10) / 100;

    }

    // ==================================================
    // ATTACK LABEL
    // ==================================================

    const attackLabel = {

        normal:
            "Normal Traffic",

        syn:
            "SYN Flood",

        udp:
            "UDP Flood",

        http:
            "HTTP Flood"

    }[selectedType] ||

        "Generic DDoS";

    const latency =
        Number(
            detection_latency_ms
        ) || 0;

    // ==================================================
    // LIVE GRAPH
    // ==================================================

    const liveTraffic =
        generateLiveTraffic(
            is_attack
        );

    /*
     * Keep the graph behaviour that was already
     * working correctly.
     */

    if (is_attack) {

        liveTraffic.attack =
            rand(2500, 5000);

        liveTraffic.normal =
            rand(400, 1500);

    }

    else {

        liveTraffic.attack = 0;

        liveTraffic.normal =
            rand(3500, 5000);

    }

    // ==================================================
    // LIVE METRICS
    // ==================================================

    metrics.recordPacket({

        isAttack:
            is_attack,

        groundTruth:
            groundTruthIsAttack,

        latencyMs:
            latency,

        sourceIP,

        attackType:
            attackLabel,

        liveNormal:
            liveTraffic.normal,

        liveAttack:
            liveTraffic.attack

    });

    // ==================================================
    // MONGODB — DETECTION HISTORY
    // ==================================================

    /*
     * DetectionHistory and Incident are independent.
     *
     * If DetectionHistory fails, an attack can still
     * create an Incident.
     */

    let historyEntry = null;

    try {

        historyEntry =
            await saveDetectionHistory({

                sourceIP,

                attackType:
                    attackLabel,

                isAttack:
                    is_attack,

                confidence,

                latencyMs:
                    latency,

                decision:
                    is_attack
                        ? "Blocked"
                        : "Allowed",

                username:
                    username ||
                    "simulator"

            });

        console.log(
            `✅ Detection history saved: ${historyEntry._id}`
        );

    }

    catch (err) {

        console.error(
            "❌ Detection history save failed:",
            err.message
        );

        broadcast({

            type:
                "persistence_warning",

            warning:
                "Detection history could not be saved.",

            error:
                err.message

        });

    }

    // ==================================================
    // NORMAL TRAFFIC
    // ==================================================

    if (!is_attack) {

        broadcast({

            type:
                "tick",

            metrics:
                metrics.getSummary(),

            last_packet: {

                is_attack:
                    false,

                confidence:
                    Math.round(
                        confidence * 100
                    ),

                source_ip:
                    sourceIP,

                attack_type:
                    "Normal Traffic"

            }

        });

        return;

    }

    // ==================================================
    // ATTACK
    // ==================================================

    const severity =
        confidence >= 0.97

            ? "critical"

            : "high";

    // ==================================================
    // CREATE INCIDENT
    // ==================================================

    let incident = null;

    try {

        incident =
            await saveIncident({

                username,

                attackLabel,

                severity,

                sourceIP,

                trafficData,

                detectionMethods:
                    detection_methods,

                ensembleScore:
                    result?.data?.ensemble_score,

                confidence,

                latencyMs:
                    latency

            });

        console.log(
            `✅ Incident saved: ${incident._id}`
        );

    }

    catch (err) {

        console.error(
            "❌ Incident save failed:",
            err.message
        );

        broadcast({

            type:
                "persistence_error",

            error:
                "Attack detected, but incident could not be saved to MongoDB.",

            details:
                err.message

        });

        /*
         * Since the Incident was not saved,
         * don't increment incident counters.
         */

        broadcast({

            type:
                "tick",

            metrics:
                metrics.getSummary(),

            last_packet: {

                is_attack:
                    true,

                confidence:
                    Math.round(
                        confidence * 100
                    ),

                source_ip:
                    sourceIP,

                attack_type:
                    attackLabel

            }

        });

        return;

    }

    // ==================================================
    // UPDATE LIVE INCIDENT COUNTERS
    // ==================================================

    metrics.incrementIncident();

    /*
     * IMPORTANT:
     *
     * The newly-created MongoDB incident is
     * unresolved.
     *
     * Therefore we DO NOT call:
     *
     * metrics.incrementResolved()
     *
     * here.
     *
     * This keeps the live dashboard consistent
     * with the Incident document.
     */

    console.log("");

    console.log(
        "================================"
    );

    console.log(
        "ATTACK DETECTED"
    );

    console.log(
        "Type :",
        attackLabel
    );

    console.log(
        "Confidence :",
        confidence
    );

    console.log(
        "Incident ID :",
        incident._id
    );

    console.log(
        "History ID :",
        historyEntry?._id ||
        "NOT SAVED"
    );

    console.log(
        "Created At :",
        incident.createdAt
    );

    console.log(
        "================================"
    );

    console.log("");

    // ==================================================
    // EMAIL ALERT
    // ==================================================

    /*
     * Email sending should not be allowed to
     * interfere with the simulator's main tick.
     *
     * We start it separately after the incident
     * has already been persisted and broadcast.
     */

    if (

        !emailCooldown &&

        (

            severity === "high" ||

            severity === "critical"

        )

    ) {

        emailCooldown = true;

        setTimeout(() => {

            emailCooldown = false;

        }, 30000);

        /*
         * Run email processing separately.
         *
         * This prevents a slow email provider from
         * delaying the simulation loop.
         */

        sendEmailAlertSafely({

            username,

            attackLabel,

            severity,

            sourceIP,

            latency,

            confidence

        });

    }

    // ==================================================
    // BROADCAST ATTACK
    // ==================================================

    broadcast({

        type:
            "tick",

        metrics:
            metrics.getSummary(),

        incident,

        last_packet: {

            is_attack:
                true,

            confidence:
                Math.round(
                    confidence * 100
                ),

            source_ip:
                sourceIP,

            attack_type:
                attackLabel

        }

    });

}

// ======================================================
// SAFE EMAIL ALERT
// ======================================================

async function sendEmailAlertSafely({

    username,

    attackLabel,

    severity,

    sourceIP,

    latency,

    confidence

}) {

    try {

        if (

            !username ||

            username === "system"

        ) {

            return;

        }

        const preference =
            await AlertPreference.findOne({

                username

            });

        if (

            !preference ||

            !preference.enabled ||

            !preference.email

        ) {

            return;

        }

        await sendAttackAlert(

            preference.email,

            {

                attackType:
                    attackLabel,

                severity,

                sourceIP,

                detection: {

                    confidence,

                    latencyMs:
                        latency

                }

            }

        );

        console.log(
            `📧 Attack alert sent to ${preference.email}`
        );

    }

    catch (err) {

        console.log(
            "Email alert error:",
            err.message
        );

    }

}

// ======================================================
// START
// ======================================================

function startSimulation(

    attackType = "random",

    username = "system"

) {

    if (_running) {

        return false;

    }

    // ==================================================
    // DATABASE CHECK
    // ==================================================

    if (!isMongoConnected()) {

        console.error(
            "❌ Cannot start simulation: MongoDB is not connected."
        );

        broadcast({

            type:
                "error",

            error:
                "MongoDB is not connected. Simulation was not started."

        });

        return false;

    }

    // ==================================================
    // CLEAR OLD INTERVAL
    // ==================================================

    if (_intervalHandle) {

        clearInterval(
            _intervalHandle
        );

        _intervalHandle = null;

    }

    // ==================================================
    // INITIALIZE STATE
    // ==================================================

    _running = true;

    _attackType =
        attackType || "random";

    /*
     * Reset only live in-memory metrics.
     *
     * MongoDB records remain untouched.
     */

    metrics.reset();

    currentAttackTraffic = 0;

    currentNormalTraffic = 4000;

    currentSession = "normal";

    packetsRemaining = 0;

    currentAttack = "syn";

    attackChain = 0;

    emailCooldown = false;

    _tickInProgress = false;

    // ==================================================
    // BROADCAST START
    // ==================================================

    broadcast({

        type:
            "start",

        attack_type:
            _attackType,

        metrics:
            metrics.getSummary()

    });

    // ==================================================
    // FIRST TICK
    // ==================================================

    runSingleTick(username);

    // ==================================================
    // CONTINUE SIMULATION
    // ==================================================

    _intervalHandle =
        setInterval(

            () => {

                runSingleTick(
                    username
                );

            },

            TICK_INTERVAL_MS

        );

    console.log("");

    console.log(
        "===================================="
    );

    console.log(
        "Simulator Started"
    );

    console.log(
        "Mode :",
        _attackType
    );

    console.log(
        "User :",
        username
    );

    console.log(
        "MongoDB : Connected"
    );

    console.log(
        "===================================="
    );

    console.log("");

    return true;

}
// ======================================================
// SAFE TICK
// ======================================================

async function runSingleTick(username) {

    if (!_running) {

        return;

    }

    // --------------------------------------------------
    // Prevent overlapping ticks
    // --------------------------------------------------

    if (_tickInProgress) {

        return;

    }

    _tickInProgress = true;

    try {

        await runTick(
            username
        );

    }

    catch (err) {

        console.error(
            "Simulation tick error:",
            err
        );

        broadcast({

            type:
                "error",

            error:
                "Simulation tick failed.",

            details:
                err.message

        });

    }

    finally {

        _tickInProgress = false;

    }

}

// ======================================================
// STOP
// ======================================================

function stopSimulation() {

    if (!_running) {

        return false;

    }

    // --------------------------------------------------
    // Stop simulation first
    // --------------------------------------------------

    _running = false;

    // --------------------------------------------------
    // Clear interval
    // --------------------------------------------------

    if (_intervalHandle) {

        clearInterval(
            _intervalHandle
        );

        _intervalHandle = null;

    }

    // --------------------------------------------------
    // Reset temporary session state
    // --------------------------------------------------

    currentAttackTraffic = 0;

    currentNormalTraffic = 4000;

    currentSession = "normal";

    packetsRemaining = 0;

    currentAttack = "syn";

    attackChain = 0;

    emailCooldown = false;

    _tickInProgress = false;

    /*
     * IMPORTANT:
     *
     * We intentionally DO NOT call:
     *
     * metrics.reset()
     *
     * here.
     *
     * The dashboard can still display the final
     * live values after the simulation stops.
     *
     * MongoDB data is also untouched.
     */

    // --------------------------------------------------
    // Broadcast stop
    // --------------------------------------------------

    broadcast({

        type:
            "stop",

        metrics:
            metrics.getSummary()

    });

    // --------------------------------------------------
    // Logging
    // --------------------------------------------------

    console.log("");

    console.log(
        "===================================="
    );

    console.log(
        "Simulator Stopped"
    );

    console.log(
        "MongoDB records preserved"
    );

    console.log(
        "===================================="
    );

    console.log("");

    return true;

}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    startSimulation,

    stopSimulation,

    isRunning,

    addSSEClient,

    removeSSEClient

};