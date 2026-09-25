import { useEffect, useMemo, useRef, useState } from "react";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";

import {
    FaBug,
    FaClock,
    FaShieldAlt,
    FaServer,
    FaChartLine,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSyncAlt
} from "react-icons/fa";

import MainLayout from "../components/layout/MainLayout";
import "../styles/analytics.css";

const API = "http://localhost:5001/api";

const COLORS = [
    "#2ea8ff",
    "#22c55e",
    "#f59e0b",
    "#ff5b5b",
    "#8b5cf6",
    "#14b8a6",
    "#ec4899"
];

const CHART_GRID = "rgba(255,255,255,0.08)";
const CHART_AXIS = { fill: "#9db2cb", fontSize: 11 };
const CHART_TOOLTIP = {
    contentStyle: {
        background: "#132238",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        color: "#fff"
    },
    labelStyle: { color: "#dce6f3" },
    itemStyle: { color: "#dce6f3" }
};

function EmptyChart({ title, hint }) {
    return (
        <div className="analytics-empty-chart">
            <strong>{title}</strong>
            <span>{hint}</span>
        </div>
    );
}

function authHeader() {

    const token = localStorage.getItem("token");

    return {
        Authorization: `Bearer ${token}`
    };

}

export default function Analytics() {

    // ==================================================
    // ANALYTICS STATE
    // ==================================================

    const [analytics, setAnalytics] = useState(null);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState(null);

    // ==================================================
    // REQUEST CONTROL
    // ==================================================

    const requestInProgress = useRef(false);

    const refreshPending = useRef(false);

    const refreshTimer = useRef(null);

    const abortController = useRef(null);

    // ==================================================
    // DEFAULT ANALYTICS
    //
    // This allows the page to render immediately even
    // if MongoDB/API takes a few seconds.
    // ==================================================

    const defaultAnalytics = {

        success: true,

        totalIncidents: 0,

        resolved: 0,

        unresolved: 0,

        averageLatency: 0,

        averageConfidence: 0,

        averageEffectiveness: null,

        mitigationEffectiveness: null,

        mostCommonAttack: "None",

        attackTypes: {},

        severity: {},

        hourly: new Array(24).fill(0),

        weekly: [

            {
                day: "Sun",
                attacks: 0
            },

            {
                day: "Mon",
                attacks: 0
            },

            {
                day: "Tue",
                attacks: 0
            },

            {
                day: "Wed",
                attacks: 0
            },

            {
                day: "Thu",
                attacks: 0
            },

            {
                day: "Fri",
                attacks: 0
            },

            {
                day: "Sat",
                attacks: 0
            }

        ],

        topAttackers: [],

        live: {

            packetsSent: 0,

            packetsBlocked: 0,

            attacksDetected: 0,

            normalTraffic: 0,

            liveNormal: 0,

            liveAttack: 0,

            effectiveness: 100,

            latency: 0,

            uptime: 0

        }

    };

    // ==================================================
    // LOAD ANALYTICS
    // ==================================================

    async function loadAnalytics() {

        // If a request is already running, don't start
        // another one.
        //
        // Instead mark that another refresh is required.

        if (requestInProgress.current) {

            refreshPending.current = true;

            return;

        }

        requestInProgress.current = true;

        refreshPending.current = false;

        setRefreshing(true);

        // Cancel an older request if one exists.

        if (abortController.current) {

            abortController.current.abort();

        }

        const controller = new AbortController();

        abortController.current = controller;

        try {

            const res = await fetch(

                `${API}/analytics`,

                {

                    headers: authHeader(),

                    signal: controller.signal

                }

            );

            if (!res.ok) {

                throw new Error(

                    `Analytics request failed: ${res.status}`

                );

            }

            const data = await res.json();

            if (!data || data.success === false) {

                throw new Error(

                    "Invalid analytics response"

                );

            }

            setAnalytics(data);

            setError(null);

        }

        catch (err) {

            // Abort errors are expected when a request
            // is cancelled.

            if (err.name !== "AbortError") {

                console.log(

                    "Analytics loading error:",

                    err

                );

                setError(

                    "Unable to refresh analytics."

                );

            }

        }

        finally {

            requestInProgress.current = false;

            setLoading(false);

            setRefreshing(false);

            // If an SSE event arrived while the previous
            // request was running, refresh once more.

            if (refreshPending.current) {

                refreshPending.current = false;

                setTimeout(() => {

                    loadAnalytics();

                }, 100);

            }

        }

    }

    // ==================================================
    // SCHEDULE REFRESH
    //
    // Several simulator ticks can happen very quickly.
    //
    // Instead of calling /analytics for every single
    // event, wait 300ms and make one request.
    // ==================================================

    function scheduleAnalyticsRefresh() {

        if (refreshTimer.current) {

            clearTimeout(

                refreshTimer.current

            );

        }

        refreshTimer.current = setTimeout(() => {

            loadAnalytics();

        }, 300);

    }

    // ==================================================
    // SSE CONNECTION
    // ==================================================

    useEffect(() => {

        // Initial background load.

        loadAnalytics();

        const refreshInterval = setInterval(
            loadAnalytics,
            3000
        );

        const source = new EventSource(

            `${API}/simulate/stream`

        );

        source.onmessage = (event) => {

            try {

                const data = JSON.parse(

                    event.data

                );

                // Ignore initial SSE connection message.

                if (

                    data.type === "tick" ||

                    data.type === "start" ||

                    data.type === "stop"

                ) {

                    scheduleAnalyticsRefresh();

                }

            }

            catch (err) {

                console.log(

                    "Invalid SSE data:",

                    err

                );

            }

        };

        source.onerror = () => {

            console.log(

                "Analytics SSE disconnected"

            );

        };

        return () => {

            source.close();

            clearInterval(refreshInterval);

            if (refreshTimer.current) {

                clearTimeout(

                    refreshTimer.current

                );

            }

            if (abortController.current) {

                abortController.current.abort();

            }

        };

    }, []);

    // ==================================================
    // USE DEFAULT DATA UNTIL API RESPONDS
    //
    // THIS IS THE IMPORTANT FIX FOR THE WHITE/LOADING
    // PAGE.
    // ==================================================

    const displayAnalytics =

        analytics || defaultAnalytics;

    // ==================================================
    // ATTACK TYPE DATA
    // ==================================================

    const attackData = useMemo(() => {

        return Object.entries(

            displayAnalytics.attackTypes || {}

        ).map(([name, value]) => ({

            name,

            value

        }));

    }, [displayAnalytics]);

    // ==================================================
    // SEVERITY DATA
    // ==================================================

    const severityData = useMemo(() => {

        return Object.entries(

            displayAnalytics.severity || {}

        ).map(([name, value]) => ({

            name,

            value

        }));

    }, [displayAnalytics]);

    // ==================================================
    // HOURLY DATA
    //
    // TODAY ONLY
    // ==================================================

    const hourlyData = useMemo(() => {
        return (
            displayAnalytics.hourly || []
        ).map((value, index) => ({
            hour: `${index}:00`,
            attacks: value
        }));
    }, [displayAnalytics]);

    const weeklyData = useMemo(() => {
        return (
            displayAnalytics.weekly || []
        ).map((item) => ({
            day: item.day,
            attacks: item.attacks
        }));
    }, [displayAnalytics]);

    // ==================================================
    // MAIN PAGE
    //
    // IMPORTANT:
    //
    // There is NO "Loading Analytics" return here.
    //
    // The page renders immediately using default values
    // and then updates when the backend responds.
    // ==================================================

    return (

        <MainLayout>

            <div className="analytics-page">

                {/* ======================================
                    HEADER
                ====================================== */}

                <div className="analytics-header">

                    <div>

                        <h1>Security Analytics Dashboard</h1>

                        <p>
                            Real-time insights into attack patterns,
                            detection performance, and system activity.
                        </p>

                    </div>

                    <div className="analytics-header-actions">

                        <div className="analytics-live-badge">
                            <span className="analytics-live-dot" />
                            Live monitoring
                        </div>

                        <button
                            type="button"
                            className="analytics-refresh-btn"
                            onClick={loadAnalytics}
                            disabled={refreshing}
                        >
                            <FaSyncAlt className={refreshing ? "spin" : ""} />
                            {refreshing ? "Refreshing..." : "Refresh data"}
                        </button>

                    </div>

                </div>

                {error && (
                    <div className="analytics-error" role="alert">
                        {error}
                    </div>
                )}

                {/* ======================================
                    KPI CARDS
                ====================================== */}

                <div className="analytics-kpis">

                    {/* TOTAL INCIDENTS */}

                    <div className="analytics-kpi">

                        <div className="icon blue">

                            <FaBug />

                        </div>

                        <div>

                            <span>

                                Total Incidents

                            </span>

                            <h2>

                                {

                                    displayAnalytics.totalIncidents ||

                                    0

                                }

                            </h2>

                        </div>

                    </div>

                    {/* MITIGATION EFFECTIVENESS */}

                    <div className="analytics-kpi">

                        <div className="icon green">

                            <FaShieldAlt />

                        </div>

                        <div>

                            <span>

                                Mitigation Effectiveness

                            </span>

                            <h2>

                                {displayAnalytics.mitigationEffectiveness == null
                                    ? "N/A"
                                    : `${displayAnalytics.mitigationEffectiveness}%`}

                            </h2>

                        </div>

                    </div>

                    {/* AVERAGE DETECTION TIME */}

                    <div className="analytics-kpi">

                        <div className="icon orange">

                            <FaClock />

                        </div>

                        <div>

                            <span>

                                Avg Detection Time

                            </span>

                            <h2>

                                {

                                    displayAnalytics.averageLatency ??

                                    0

                                } ms

                            </h2>

                        </div>

                    </div>

                    {/* ACTIVE ATTACK TYPES */}

                    <div className="analytics-kpi">

                        <div className="icon purple">

                            <FaServer />

                        </div>

                        <div>

                            <span>

                                Active Attack Types

                            </span>

                            <h2>

                                {attackData.length}

                            </h2>

                        </div>

                    </div>

                </div>

                {/* ======================================
                    ATTACK TYPES + SEVERITY
                ====================================== */}

                <div className="analytics-grid">

                    <h2 className="analytics-section-title">Attack Breakdown</h2>

                    <div className="analytics-chart-card">
                        <h3>Attack Types</h3>
                        {attackData.length === 0 ? (
                            <EmptyChart
                                title="No attack types yet"
                                hint="Run the simulator or wait for incidents to populate this chart."
                            />
                        ) : (
                            <div className="analytics-chart-body">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={attackData}>
                                        <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={CHART_AXIS} />
                                        <YAxis tick={CHART_AXIS} />
                                        <Tooltip {...CHART_TOOLTIP} />
                                        <Bar dataKey="value" fill="#2ea8ff" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className="analytics-chart-card">
                        <h3>Severity Distribution</h3>
                        {severityData.length === 0 ? (
                            <EmptyChart
                                title="No severity data yet"
                                hint="Severity metrics appear once incidents are recorded."
                            />
                        ) : (
                            <div className="analytics-chart-body">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={severityData}
                                            dataKey="value"
                                            nameKey="name"
                                            outerRadius={105}
                                            label
                                        >
                                            {severityData.map((item, index) => (
                                                <Cell
                                                    key={item.name}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip {...CHART_TOOLTIP} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                </div>

                {/* ======================================
                    HOURLY + WEEKLY
                ====================================== */}

                <div className="analytics-grid">

                    <h2 className="analytics-section-title">Trends Over Time</h2>

                    <div className="analytics-chart-card">
                        <h3>Hourly Attack Trend</h3>
                        <div className="analytics-chart-body">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={hourlyData}>
                                    <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" tick={CHART_AXIS} interval={3} />
                                    <YAxis tick={CHART_AXIS} allowDecimals={false} />
                                    <Tooltip {...CHART_TOOLTIP} />
                                    <Line
                                        type="monotone"
                                        dataKey="attacks"
                                        stroke="#ff5b5b"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="analytics-chart-card">
                        <h3>Weekly Trend</h3>
                        <div className="analytics-chart-body">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyData}>
                                    <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
                                    <XAxis dataKey="day" tick={CHART_AXIS} />
                                    <YAxis tick={CHART_AXIS} allowDecimals={false} />
                                    <Tooltip {...CHART_TOOLTIP} />
                                    <Line
                                        type="monotone"
                                        dataKey="attacks"
                                        stroke="#2ecc71"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#2ecc71" }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* ======================================
                    TOP ATTACKERS + SECURITY SUMMARY
                ====================================== */}

                <div className="analytics-grid">

                    <h2 className="analytics-section-title">Threat Intelligence</h2>

                    <div className="analytics-chart-card">
                        <h3>Top Attacking IPs</h3>
                        <div className="analytics-table-wrap">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>IP Address</th>
                                        <th>Attacks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(displayAnalytics.topAttackers || []).length === 0 ? (
                                        <tr className="analytics-table-empty">
                                            <td colSpan="3">No attacker data available yet</td>
                                        </tr>
                                    ) : (
                                        (displayAnalytics.topAttackers || []).map((attacker, index) => (
                                            <tr key={`${attacker.ip}-${index}`}>
                                                <td className="rank-cell">{index + 1}</td>
                                                <td className="ip-cell">{attacker.ip}</td>
                                                <td className="count-cell">{attacker.attacks}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="analytics-chart-card">
                        <h3>Security Summary</h3>
                        <div className="summary-grid">
                            <div className="summary-box">
                                <FaCheckCircle color="#22c55e" size={26} />
                                <span>Resolved</span>
                                <h2>{displayAnalytics.resolved ?? 0}</h2>
                            </div>
                            <div className="summary-box">
                                <FaExclamationTriangle color="#ff5b5b" size={26} />
                                <span>Active</span>
                                <h2>{displayAnalytics.unresolved ?? 0}</h2>
                            </div>
                            <div className="summary-box">
                                <FaChartLine color="#2ea8ff" size={26} />
                                <span>Avg Confidence</span>
                                <h2>
                                    {displayAnalytics.averageConfidence == null
                                        ? "N/A"
                                        : `${displayAnalytics.averageConfidence}%`}
                                </h2>
                            </div>
                            <div className="summary-box wide">
                                <FaBug color="#8b5cf6" size={26} />
                                <span>Most Common Attack</span>
                                <h2>{displayAnalytics.mostCommonAttack || "None"}</h2>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </MainLayout>

    );

}