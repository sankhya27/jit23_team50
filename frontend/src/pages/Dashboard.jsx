import { useEffect, useState } from "react";

import MainLayout from "../components/layout/MainLayout";
import KPICard from "../components/dashboard/KPICard";
import ChartsPanel from "../components/ChartsPanel";
import ControlPanel from "../components/ControlPanel";
import RecentAlerts from "../components/RecentAlerts";

import { useAuth } from "../context/AuthContext";
import { getMetrics } from "../api";

import {
    FaShieldAlt,
    FaBug,
    FaBan,
    FaClock,
    FaServer,
    FaChartLine,
    FaCircle,
    FaSyncAlt
} from "react-icons/fa";

import "../styles/dashboard.css";

const API = "http://localhost:5001/api";

function authHeader() {

    const token =
        localStorage.getItem("token");

    return {

        Authorization:
            `Bearer ${token}`,

        "Cache-Control":
            "no-cache"

    };

}

const Dashboard = () => {

    const { user } = useAuth();

    // =====================================================
    // METRICS
    // =====================================================

    const [metrics, setMetrics] = useState({

        packets_sent: 0,

        attacks_detected: 0,

        packets_blocked: 0,

        avg_latency_ms: 0,

        effectiveness_pct: 100,

        uptime_seconds: 0,

        live_normal: 0,

        live_attack: 0

    });

    // =====================================================
    // ANALYTICS
    // =====================================================

    const [analytics, setAnalytics] = useState({

        attackTypes: {},

        severity: {}

    });

    // =====================================================
    // RECENT ALERTS
    // =====================================================

    const [recentAlerts, setRecentAlerts] =
        useState([]);

    // =====================================================
    // CONNECTION
    // =====================================================

    const [connectionStatus, setConnectionStatus] =
        useState("Connecting");

    const [lastUpdated, setLastUpdated] =
        useState(new Date());

    // =====================================================
    // REFRESH BUTTON
    // =====================================================

    const [refreshing, setRefreshing] =
        useState(false);

    // =====================================================
    // LOAD METRICS
    // =====================================================

    async function loadMetrics() {

        try {

            const data =
                await getMetrics();

            if (data) {

                setMetrics(data);

                setLastUpdated(
                    new Date()
                );

            }

        }

        catch (err) {

            console.log(
                "Metrics loading error:",
                err
            );

        }

    }

    // =====================================================
    // LOAD ANALYTICS
    // =====================================================

    async function loadAnalytics() {

        try {

            const res =
                await fetch(

                    `${API}/analytics`,

                    {

                        headers:
                            authHeader(),

                        cache:
                            "no-store"

                    }

                );

            if (!res.ok) {

                throw new Error(
                    `Analytics request failed: ${res.status}`
                );

            }

            const data =
                await res.json();

            /*
             * Do NOT require data.success here.
             *
             * Your analytics response may contain
             * the actual analytics object without
             * a success property.
             */

            if (data) {

                setAnalytics(data);

            }

        }

        catch (err) {

            console.log(
                "Analytics loading error:",
                err
            );

        }

    }

    // =====================================================
    // LOAD EXISTING RECENT ALERTS
    // =====================================================

    async function loadRecentAlerts() {

        try {

            const res =
                await fetch(

                    `${API}/incidents`,

                    {

                        headers:
                            authHeader(),

                        cache:
                            "no-store"

                    }

                );

            if (!res.ok) {

                return;

            }

            const data =
                await res.json();

            let incidents = [];

            if (Array.isArray(data)) {

                incidents = data;

            }

            else if (
                Array.isArray(
                    data.incidents
                )
            ) {

                incidents =
                    data.incidents;

            }

            setRecentAlerts(

                incidents.slice(0, 6)

            );

        }

        catch (err) {

            console.log(
                "Recent alerts loading error:",
                err
            );

        }

    }

    // =====================================================
    // MANUAL REFRESH
    // =====================================================

    async function manualRefresh() {

        if (refreshing) {

            return;

        }

        setRefreshing(true);

        try {

            await Promise.all([

                loadMetrics(),

                loadAnalytics(),

                loadRecentAlerts()

            ]);

            setLastUpdated(
                new Date()
            );

        }

        catch (err) {

            console.log(
                "Dashboard refresh error:",
                err
            );

        }

        finally {

            /*
             * IMPORTANT:
             *
             * Do not use setTimeout here.
             *
             * The old code could leave the UI showing
             * "Refreshing..." when a request got stuck.
             */

            setRefreshing(false);

        }

    }

    // =====================================================
    // INITIAL LOAD + SINGLE SSE CONNECTION
    // =====================================================

    useEffect(() => {

        let mounted = true;

        /*
         * Initial data load.
         *
         * We intentionally don't call manualRefresh()
         * here because that changes the refresh-button
         * state during initial page loading.
         */

        loadMetrics();

        loadAnalytics();

        loadRecentAlerts();

        // =================================================
        // ONE SSE CONNECTION ONLY
        // =================================================

        const eventSource =
            new EventSource(

                `${API}/simulate/stream`

            );

        eventSource.onopen = () => {

            if (!mounted) return;

            setConnectionStatus(
                "Connected"
            );

        };

        eventSource.onmessage =
            (event) => {

                if (!mounted) return;

                try {

                    const data =
                        JSON.parse(
                            event.data
                        );

                    // =====================================
                    // SIMULATION START
                    // =====================================

                    if (
                        data.type ===
                        "start"
                    ) {

                        setLastUpdated(
                            new Date()
                        );

                        return;

                    }

                    // =====================================
                    // SIMULATION STOP
                    // =====================================

                    if (
                        data.type ===
                        "stop"
                    ) {

                        if (
                            data.metrics
                        ) {

                            setMetrics(
                                data.metrics
                            );

                        }

                        setLastUpdated(
                            new Date()
                        );

                        return;

                    }

                    // =====================================
                    // LIVE METRICS
                    // =====================================

                    if (
                        data.metrics
                    ) {

                        setMetrics(
                            data.metrics
                        );

                        setLastUpdated(
                            new Date()
                        );

                    }

                    // =====================================
                    // LIVE ATTACK ALERT
                    // =====================================

                    /*
                     * simulator.js sends:
                     *
                     * data.incident
                     *
                     * and
                     *
                     * data.last_packet
                     *
                     * for an attack.
                     *
                     * We prefer the complete incident object.
                     */

                    if (
                        data.type ===
                            "tick" &&
                        data.incident
                    ) {

                        setRecentAlerts(
                            previous => {

                                const incident =
                                    data.incident;

                                const incidentId =
                                    incident._id ||
                                    incident.id;

                                /*
                                 * Prevent duplicate alerts.
                                 */

                                const alreadyExists =
                                    previous.some(
                                        alert =>
                                            (
                                                alert._id ||
                                                alert.id
                                            ) ===
                                            incidentId
                                    );

                                if (
                                    alreadyExists
                                ) {

                                    return previous;

                                }

                                return [

                                    incident,

                                    ...previous

                                ].slice(0, 6);

                            }

                        );

                    }

                    /*
                     * Fallback:
                     *
                     * If an attack packet arrives without
                     * a complete incident object, create a
                     * small alert object from last_packet.
                     */

                    else if (
                        data.type ===
                            "tick" &&
                        data.last_packet?.is_attack
                    ) {

                        const packet =
                            data.last_packet;

                        const fallbackAlert = {

                            id:
                                `${packet.source_ip}-${Date.now()}`,

                            attackType:
                                packet.attack_type ||
                                "Unknown Attack",

                            severity:
                                packet.confidence >= 97
                                    ? "critical"
                                    : "high",

                            sourceIP:
                                packet.source_ip ||
                                "Unknown IP",

                            detection: {

                                confidence:
                                    (
                                        packet.confidence ||
                                        0
                                    ) / 100

                            },

                            createdAt:
                                new Date()

                        };

                        setRecentAlerts(
                            previous =>
                                [
                                    fallbackAlert,
                                    ...previous
                                ].slice(0, 6)
                        );

                    }

                }

                catch (err) {

                    console.log(
                        "Invalid SSE data:",
                        err
                    );

                }

            };

        eventSource.onerror = () => {

            if (!mounted) return;

            setConnectionStatus(
                "Disconnected"
            );

            /*
             * EventSource automatically attempts
             * to reconnect.
             *
             * We DO NOT create another EventSource
             * here.
             */

        };

        // =================================================
        // CLEANUP
        // =================================================

        return () => {

            mounted = false;

            eventSource.close();

        };

    }, []);

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <MainLayout>

            <div className="dashboard-wrapper">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="dashboard-header">

                    <div className="dashboard-title">

                        <h1>

                            Security Operations Dashboard

                        </h1>

                        <p>

                            ML-powered DDoS Detection,
                            Traffic Analysis & Real-Time
                            Threat Monitoring

                        </p>

                    </div>

                    <div className="dashboard-actions">

                        {/* BACKEND STATUS */}

                        <div className="status-card">

                            <FaCircle

                                className={

                                    connectionStatus ===
                                    "Connected"

                                        ? "status-green"

                                        : "status-red"

                                }

                            />

                            <div>

                                <span className="status-label">

                                    Backend Status

                                </span>

                                <strong>

                                    {
                                        connectionStatus
                                    }

                                </strong>

                            </div>

                        </div>

                        {/* LAST SYNC */}

                        <div className="status-card">

                            <FaClock />

                            <div>

                                <span className="status-label">

                                    Last Sync

                                </span>

                                <strong>

                                    {
                                        lastUpdated.toLocaleTimeString()
                                    }

                                </strong>

                            </div>

                        </div>

                        {/* ACTIVE ANALYST */}

                        <div className="status-card">

                            <FaShieldAlt />

                            <div>

                                <span className="status-label">

                                    Active Analyst

                                </span>

                                <strong>

                                    {
                                        user?.username ||
                                        "Unknown"
                                    }

                                </strong>

                            </div>

                        </div>

                        {/* REFRESH */}

                        <button

                            className="refresh-btn"

                            onClick={
                                manualRefresh
                            }

                            disabled={
                                refreshing
                            }

                        >

                            <FaSyncAlt

                                className={

                                    refreshing

                                        ? "rotate-icon"

                                        : ""

                                }

                            />

                            {

                                refreshing

                                    ? " Refreshing..."

                                    : " Refresh Dashboard"

                            }

                        </button>

                    </div>

                </div>

                {/* =================================================
                    KPI CARDS
                ================================================= */}

                <div className="kpi-grid">

                    <KPICard

                        title="Packets Analysed"

                        subtitle="Live Network Traffic"

                        value={

                            (
                                metrics.packets_sent ||
                                0
                            ).toLocaleString()

                        }

                        color="#2ea8ff"

                        icon={
                            <FaServer />
                        }

                    />

                    <KPICard

                        title="Attacks Detected"

                        subtitle="ML Threat Detection"

                        value={

                            (
                                metrics.attacks_detected ||
                                0
                            ).toLocaleString()

                        }

                        color="#ef4444"

                        icon={
                            <FaBug />
                        }

                    />

                    <KPICard

                        title="Packets Blocked"

                        subtitle="Firewall Protection"

                        value={

                            (
                                metrics.packets_blocked ||
                                0
                            ).toLocaleString()

                        }

                        color="#f59e0b"

                        icon={
                            <FaBan />
                        }

                    />

                    <KPICard

                        title="Detection Latency"

                        subtitle="Average ML Response"

                        value={

                            `${
                                metrics.avg_latency_ms ||
                                0
                            } ms`

                        }

                        color="#06b6d4"

                        icon={
                            <FaClock />
                        }

                    />

                    <KPICard

                        title="Detection Accuracy"

                        subtitle="ML Model Accuracy"

                        value={

                            `${
                                metrics.effectiveness_pct ??
                                100
                            }%`

                        }

                        color="#22c55e"

                        icon={
                            <FaShieldAlt />
                        }

                    />

                    <KPICard

                        title="System Uptime"

                        subtitle="Backend Runtime"

                        value={

                            `${
                                metrics.uptime_seconds ||
                                0
                            }s`

                        }

                        color="#8b5cf6"

                        icon={
                            <FaChartLine />
                        }

                    />

                </div>

                {/* =================================================
                    DASHBOARD CONTENT
                ================================================= */}

                <div className="dashboard-bottom">

                    <div className="left-column">

                        <ChartsPanel

                            metrics={
                                metrics
                            }

                            analytics={
                                analytics
                            }

                        />

                        <ControlPanel />

                    </div>

                    <div className="right-column">

                        <RecentAlerts

                            alerts={
                                recentAlerts
                            }

                        />

                    </div>

                </div>

            </div>

        </MainLayout>

    );

};

export default Dashboard;