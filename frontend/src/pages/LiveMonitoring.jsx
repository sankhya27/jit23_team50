import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import MainLayout from "../components/layout/MainLayout";

import ThreatMeter from "../components/live/ThreatMeter";
import DetectionGauge from "../components/live/DetectionGauge";
import TopAttackers from "../components/live/TopAttackers";
import SystemHealth from "../components/live/SystemHealth";
import IncidentTimeline from "../components/live/IncidentTimeline";
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
            effectiveness_pct: null,
            mitigation_effectiveness_pct: null,
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

                setMetrics(previous => ({
                    ...previous,
                    ...data.metrics,
                    mitigation_effectiveness_pct:
                        data.metrics.mitigation_effectiveness_pct ??
                        previous.mitigation_effectiveness_pct
                }));

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

    useEffect(() => {

        async function loadCurrentMetrics() {

            try {

                const response = await fetch(
                    "http://localhost:5001/api/metrics",
                    { cache: "no-store" }
                );

                if (!response.ok) return;

                const data = await response.json();

                setMetrics(previous => ({
                    ...previous,
                    ...data,
                    mitigation_effectiveness_pct:
                        data.mitigation_effectiveness_pct ??
                        previous.mitigation_effectiveness_pct
                }));

            }

            catch (error) {

                console.error("Live metrics refresh failed:", error);

            }

        }

        loadCurrentMetrics();

        const timer = setInterval(loadCurrentMetrics, 3000);

        return () => clearInterval(timer);

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

                        <p className="live-status-line">

                            Status :
                            <span className={`live-status ${status === "Connected" ? "online" : "offline"}`}>
                                {status}
                            </span>

                        </p>

                    </div>

                    <div className="live-header-actions">

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
                        value={metrics.mitigation_effectiveness_pct}
                    />

                    <SystemHealth
                        onHealthChange={setHealth}
                    />

                </div>

                <div className="bottom-grid single-panel">

                    <TopAttackers />

                </div>

                <IncidentTimeline />

            </div>

        </MainLayout>

    );

}