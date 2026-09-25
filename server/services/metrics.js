/**
 * Global metrics service
 *
 * IMPORTANT:
 *
 * This service stores ONLY LIVE / CURRENT SIMULATION metrics.
 *
 * Historical data must come from MongoDB:
 *
 * - Incident collection
 * - DetectionHistory collection
 *
 * Restarting the backend intentionally resets these live values.
 */

class MetricsService {

    constructor() {

        this.reset();

    }

    // ======================================================
    // RESET LIVE METRICS
    // ======================================================

    reset() {

        // --------------------------------------------------
        // Traffic
        // --------------------------------------------------

        this.packetsSent = 0;

        this.normalTraffic = 0;

        // --------------------------------------------------
        // Detection
        // --------------------------------------------------

        this.attacksDetected = 0;

        this.packetsBlocked = 0;

        // --------------------------------------------------
        // Prediction evaluation
        //
        // These values are updated ONLY when an actual
        // groundTruth value is provided.
        // --------------------------------------------------

        this.correctPredictions = 0;

        this.totalPredictions = 0;

        // --------------------------------------------------
        // Blocked IPs
        // --------------------------------------------------

        this.blockedIPs = new Set();

        // --------------------------------------------------
        // Detection latency
        // --------------------------------------------------

        this.detectionLatencies = [];

        // --------------------------------------------------
        // Runtime start time
        // --------------------------------------------------

        this.startTime = Date.now();

        // --------------------------------------------------
        // Recent live traffic
        // --------------------------------------------------

        this.recentTraffic = [];

        // --------------------------------------------------
        // Live graph traffic
        // --------------------------------------------------

        this.liveNormalTraffic = 0;

        this.liveAttackTraffic = 0;

        // --------------------------------------------------
        // Live incident counters
        // --------------------------------------------------

        this.totalIncidents = 0;

        this.resolvedIncidents = 0;

        this.unresolvedIncidents = 0;

    }

    // ======================================================
    // INCIDENT COUNTERS
    // ======================================================

    incrementIncident() {

        this.totalIncidents++;

        this.unresolvedIncidents++;

    }

    // ======================================================

    incrementResolved() {

        if (this.unresolvedIncidents > 0) {

            this.unresolvedIncidents--;

        }

        this.resolvedIncidents++;

    }

    // ======================================================

    incrementUnresolved() {

        this.unresolvedIncidents++;

    }

    // ======================================================
    // RECORD PACKET / TRAFFIC EVENT
    // ======================================================

    recordPacket({

        isAttack,

        groundTruth = null,

        latencyMs,

        sourceIP,

        attackType = "Normal Traffic",

        liveNormal = null,

        liveAttack = null

    }) {

        // ==================================================
        // LIVE GRAPH VALUES
        // ==================================================

        if (
            Number.isFinite(
                Number(liveNormal)
            )
        ) {

            this.liveNormalTraffic =
                Math.max(
                    0,
                    Math.round(
                        Number(liveNormal)
                    )
                );

        }

        if (
            Number.isFinite(
                Number(liveAttack)
            )
        ) {

            this.liveAttackTraffic =
                Math.max(
                    0,
                    Math.round(
                        Number(liveAttack)
                    )
                );

        }

        // ==================================================
        // TRAFFIC AMOUNT
        // ==================================================

        const normal =
            Number.isFinite(
                Number(liveNormal)
            )
                ? Math.max(
                    0,
                    Number(liveNormal)
                )
                : 0;

        const attack =
            Number.isFinite(
                Number(liveAttack)
            )
                ? Math.max(
                    0,
                    Number(liveAttack)
                )
                : 0;

        const trafficBurst =
            Math.round(
                normal + attack
            );

        // --------------------------------------------------
        // Packets/traffic processed during this live tick
        // --------------------------------------------------

        this.packetsSent +=
            trafficBurst;

        // ==================================================
        // DETECTION LATENCY
        // ==================================================

        const numericLatency =
            Number(latencyMs);

        if (
            Number.isFinite(
                numericLatency
            ) &&
            numericLatency >= 0
        ) {

            this.detectionLatencies.push(
                numericLatency
            );

        }

        // --------------------------------------------------
        // Prevent unlimited memory growth
        // --------------------------------------------------

        if (
            this.detectionLatencies.length >
            500
        ) {

            this.detectionLatencies.shift();

        }

        // ==================================================
        // ATTACK TRAFFIC
        // ==================================================

        if (Boolean(isAttack)) {

            this.attacksDetected++;

            this.packetsBlocked +=
                Math.round(attack);

            if (
                sourceIP &&
                typeof sourceIP === "string"
            ) {

                this.blockedIPs.add(
                    sourceIP
                );

            }

        }

        // ==================================================
        // NORMAL TRAFFIC
        // ==================================================

        else {

            this.normalTraffic +=
                Math.round(normal);

        }

        // ==================================================
        // ACTUAL PREDICTION EVALUATION
        // ==================================================
        //
        // IMPORTANT:
        //
        // We DO NOT randomly manufacture accuracy.
        //
        // If groundTruth is supplied:
        //     compare prediction with truth.
        //
        // If groundTruth is not supplied:
        //     don't count this event toward accuracy.
        //
        // This prevents an unverified percentage from being displayed.
        // ==================================================

        if (
            groundTruth !== null &&
            typeof groundTruth !== "undefined"
        ) {

            this.totalPredictions++;

            if (
                Boolean(isAttack) ===
                Boolean(groundTruth)
            ) {

                this.correctPredictions++;

            }

        }

        // ==================================================
        // RECENT TRAFFIC ENTRY
        // ==================================================

        this.recentTraffic.unshift({

            id:
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,

            time:
                new Date().toLocaleTimeString(),

            sourceIP:
                sourceIP || "unknown",

            attackType,

            blocked:
                Boolean(isAttack)

        });

        // ==================================================
        // KEEP ONLY MOST RECENT 20
        // ==================================================

        if (
            this.recentTraffic.length >
            20
        ) {

            this.recentTraffic.pop();

        }

    }

    // ======================================================
    // AVERAGE LATENCY
    // ======================================================

    get avgLatencyMs() {

        if (
            this.detectionLatencies.length === 0
        ) {

            return 0;

        }

        const total =
            this.detectionLatencies.reduce(

                (sum, value) =>
                    sum + value,

                0

            );

        return Math.round(

            total /
            this.detectionLatencies.length

        );

    }

    // ======================================================
    // LIVE EFFECTIVENESS
    // ======================================================
    //
    // This represents prediction accuracy ONLY when
    // actual ground-truth labels have been supplied.
    //
    // The simulator currently does not provide groundTruth,
    // so this remains unavailable rather than becoming a fake number.
    // ======================================================

    get effectivenessPct() {

        if (
            this.totalPredictions === 0
        ) {

            return null;

        }

        return Math.round(

            (
                this.correctPredictions *
                100
            ) /
            this.totalPredictions

        );

    }

    get mitigationEffectivenessPct() {

        if (this.packetsSent <= 0) {

            return null;

        }

        return Number(
            ((this.packetsBlocked / this.packetsSent) * 100).toFixed(1)
        );

    }

    // ======================================================
    // SUMMARY
    // ======================================================

    getSummary() {

        return {

            // ------------------------------------------------
            // Live traffic
            // ------------------------------------------------

            packets_sent:
                this.packetsSent,

            normal_traffic:
                this.normalTraffic,

            attacks_detected:
                this.attacksDetected,

            packets_blocked:
                this.packetsBlocked,

            mitigation_effectiveness_pct:
                this.mitigationEffectivenessPct,

            ips_blocked:
                this.blockedIPs.size,

            // ------------------------------------------------
            // Live detection performance
            // ------------------------------------------------

            avg_latency_ms:
                this.avgLatencyMs,

            effectiveness_pct:
                this.effectivenessPct,

            // ------------------------------------------------
            // Backend uptime
            // ------------------------------------------------

            uptime_seconds:

                Math.round(

                    (
                        Date.now() -
                        this.startTime
                    ) /
                    1000

                ),

            // ------------------------------------------------
            // Live graph traffic
            // ------------------------------------------------

            live_normal:
                this.liveNormalTraffic,

            live_attack:
                this.liveAttackTraffic,

            // ------------------------------------------------
            // Recent live traffic
            // ------------------------------------------------

            recent_traffic:
                this.recentTraffic,

            // ------------------------------------------------
            // Live incident counters
            // ------------------------------------------------

            total_incidents:
                this.totalIncidents,

            resolved_incidents:
                this.resolvedIncidents,

            unresolved_incidents:
                this.unresolvedIncidents

        };

    }

}

// ======================================================
// SINGLE GLOBAL INSTANCE
// ======================================================

module.exports =
    new MetricsService();