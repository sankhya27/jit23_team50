import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import MainLayout from "../components/layout/MainLayout";

import ThreatMeter from "../components/live/ThreatMeter";
import DetectionGauge from "../components/live/DetectionGauge";
import TopAttackers from "../components/live/TopAttackers";
import SystemHealth from "../components/live/SystemHealth";
import IncidentTimeline from "../components/live/IncidentTimeline";
import AttackOrigins from "../components/live/AttackOrigins";
import ExportReportButton from "../components/live/ExportReportButton";

import "../styles/liveMonitoring.css";

export default function LiveMonitoring() {

    const [status, setStatus] = useState("Disconnected");

    const [metrics, setMetrics] = useState({

        packets_sent: 0,
        attacks_detected: 0,
        normal_traffic: 0,
        packets_blocked: 0,
        avg_latency_ms: 0,
        effectiveness_pct: 100,
        live_attack: 0,
        live_normal: 0

    });

    const [health, setHealth] = useState({});

    const previousAttackCount = useRef(0);

    useEffect(() => {

        const source = new EventSource(
            "http://localhost:5001/api/simulate/stream"
        );

        source.onopen = () => {

            setStatus("Connected");

        };

        source.onmessage = (event) => {

            const data = JSON.parse(event.data);

            if (data.metrics) {

                setMetrics(data.metrics);

                if (
                    data.metrics.attacks_detected >
                    previousAttackCount.current
                ) {

                    previousAttackCount.current =
                        data.metrics.attacks_detected;

                    if (data.last_packet?.is_attack) {

                        toast.error(
                            <>
                                <strong>
                                    🚨 DDoS Attack Detected
                                </strong>

                                <br/>

                                Attack :
                                {" "}
                                {data.last_packet.attack_type}

                                <br/>

                                Confidence :
                                {" "}
                                {data.last_packet.confidence}%

                                <br/>

                                Source :
                                {" "}
                                {data.last_packet.source_ip}

                            </>,
                            {
                                autoClose: 5000
                            }
                        );

                    }

                }

            }

        };

        source.onerror = () => {

            setStatus("Disconnected");

        };

        return () => source.close();

    }, []);

    // ------------------------------
    // Threat Level
    // ------------------------------

    let threat = "LOW";

    if (metrics.live_attack >= 400)

        threat = "CRITICAL";

    else if (metrics.live_attack >= 250)

        threat = "HIGH";

    else if (metrics.live_attack >= 100)

        threat = "MEDIUM";

    return (

        <MainLayout>

            <div className="live-page">

                <div className="live-header">

                    <div>

                        <h1>

                            Live Monitoring Center

                        </h1>

                        <p>

                            Real-time network monitoring & attack visualization

                        </p>

                        <p
                            style={{
                                marginTop: "8px",
                                fontSize: "13px",
                                color: "#7e93ab"
                            }}
                        >

                            Status :
                            <span
                                style={{
                                    color:
                                        status === "Connected"
                                            ? "#22c55e"
                                            : "#ef4444",
                                    marginLeft: "8px",
                                    fontWeight: 600
                                }}
                            >
                                {status}
                            </span>

                        </p>

                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "20px",
                            flexWrap: "wrap"
                        }}
                    >

                        <ExportReportButton
                            metrics={metrics}
                            threat={threat}
                            health={health}
                        />

                        <ThreatMeter
                            level={threat}
                        />

                    </div>

                </div>

                <div className="bottom-grid">

                    <DetectionGauge
                        value={metrics.effectiveness_pct}
                    />

                    <SystemHealth
                        onHealthChange={setHealth}
                    />

                </div>

                <div className="bottom-grid">

                    <TopAttackers />

                    <AttackOrigins
                        attacks={metrics.attacks_detected}
                    />

                </div>

                <IncidentTimeline />

            </div>

        </MainLayout>

    );

}