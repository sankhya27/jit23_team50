import { useEffect, useMemo, useRef, useState } from "react";

import MainLayout from "../components/layout/MainLayout";

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
    FaExclamationTriangle
} from "react-icons/fa";

import "../styles/analytics.css";

const API = "http://localhost:5001/api";

const COLORS = [
    "#2563eb",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6",
    "#ec4899"
];

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

        averageEffectiveness: 100,

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

                        <h1>

                            Security Analytics Dashboard

                        </h1>

                        <p>

                            Real-time insights into attack
                            patterns, detection performance
                            and system activity.

                        </p>

                    </div>

                </div>

                {/* ======================================
                    OPTIONAL ERROR MESSAGE
                ====================================== */}

                {error && (

                    <div
                        style={{
                            padding: "10px 15px",
                            marginBottom: "15px",
                            borderRadius: "8px",
                            background: "#fff7ed",
                            color: "#c2410c",
                            fontSize: "14px"
                        }}
                    >

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

                    {/* DETECTION ACCURACY */}

                    <div className="analytics-kpi">

                        <div className="icon green">

                            <FaShieldAlt />

                        </div>

                        <div>

                            <span>

                                Detection Accuracy

                            </span>

                            <h2>

                                {

                                    displayAnalytics.averageEffectiveness ??

                                    100

                                }%

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

                    {/* ATTACK TYPES */}

                    <div className="chart-card">

                        <h3>

                            Attack Types

                        </h3>

                        <ResponsiveContainer

                            width="100%"

                            height={320}

                        >

                            <BarChart

                                data={attackData}

                            >

                                <CartesianGrid

                                    strokeDasharray="3 3"

                                />

                                <XAxis

                                    dataKey="name"

                                />

                                <YAxis />

                                <Tooltip />

                                <Bar

                                    dataKey="value"

                                    fill="#2563eb"

                                    radius={[

                                        8,

                                        8,

                                        0,

                                        0

                                    ]}

                                />

                            </BarChart>

                        </ResponsiveContainer>

                    </div>

                    {/* SEVERITY */}

                    <div className="chart-card">

                        <h3>

                            Severity Distribution

                        </h3>

                        <ResponsiveContainer

                            width="100%"

                            height={320}

                        >

                            <PieChart>

                                <Pie

                                    data={severityData}

                                    dataKey="value"

                                    nameKey="name"

                                    outerRadius={110}

                                    label

                                >

                                    {severityData.map(

                                        (

                                            item,

                                            index

                                        ) => (

                                            <Cell

                                                key={index}

                                                fill={

                                                    COLORS[

                                                        index %

                                                        COLORS.length

                                                    ]

                                                }

                                            />

                                        )

                                    )}

                                </Pie>

                                <Legend />

                                <Tooltip />

                            </PieChart>

                        </ResponsiveContainer>

                    </div>

                </div>

                {/* ======================================
                    HOURLY + WEEKLY
                ====================================== */}

                <div className="analytics-grid">

                    {/* HOURLY */}

                    <div className="chart-card">

                        <h3>

                            Hourly Attack Trend

                        </h3>

                        <ResponsiveContainer

                            width="100%"

                            height={320}

                        >

                            <LineChart

                                data={hourlyData}

                            >

                                <CartesianGrid

                                    strokeDasharray="3 3"

                                />

                                <XAxis

                                    dataKey="hour"

                                />

                                <YAxis />

                                <Tooltip />

                                <Line

                                    type="monotone"

                                    dataKey="attacks"

                                    stroke="#ef4444"

                                    strokeWidth={3}

                                    dot={false}

                                />

                            </LineChart>

                        </ResponsiveContainer>

                    </div>

                    {/* WEEKLY */}

                    <div className="chart-card">

                        <h3>

                            Weekly Trend

                        </h3>

                        <ResponsiveContainer

                            width="100%"

                            height={320}

                        >

                            <LineChart

                                data={weeklyData}

                            >

                                <CartesianGrid

                                    strokeDasharray="3 3"

                                />

                                <XAxis

                                    dataKey="day"

                                />

                                <YAxis />

                                <Tooltip />

                                <Line

                                    type="monotone"

                                    dataKey="attacks"

                                    stroke="#22c55e"

                                    strokeWidth={3}

                                    dot

                                />

                            </LineChart>

                        </ResponsiveContainer>

                    </div>

                </div>

                {/* ======================================
                    TOP ATTACKERS + SECURITY SUMMARY
                ====================================== */}

                <div className="analytics-grid">

                    {/* TOP ATTACKING IPS */}

                    <div className="chart-card">

                        <h3>

                            Top Attacking IPs

                        </h3>

                        <table className="analytics-table">

                            <thead>

                                <tr>

                                    <th>

                                        Rank

                                    </th>

                                    <th>

                                        IP Address

                                    </th>

                                    <th>

                                        Attacks

                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {(

                                    displayAnalytics.topAttackers ||

                                    []

                                ).length === 0

                                    ?

                                    (

                                        <tr>

                                            <td

                                                colSpan="3"

                                                style={{

                                                    textAlign:

                                                        "center",

                                                    padding:

                                                        "30px"

                                                }}

                                            >

                                                No attacker data
                                                available

                                            </td>

                                        </tr>

                                    )

                                    :

                                    (

                                        displayAnalytics.topAttackers ||

                                        []

                                    ).map(

                                        (

                                            attacker,

                                            index

                                        ) => (

                                            <tr

                                                key={index}

                                            >

                                                <td>

                                                    {index + 1}

                                                </td>

                                                <td>

                                                    {

                                                        attacker.ip

                                                    }

                                                </td>

                                                <td>

                                                    {

                                                        attacker.attacks

                                                    }

                                                </td>

                                            </tr>

                                        )

                                    )}

                            </tbody>

                        </table>

                    </div>

                    {/* SECURITY SUMMARY */}

                    <div className="chart-card">

                        <h3>

                            Security Summary

                        </h3>

                        <div className="summary-grid">

                            {/* RESOLVED */}

                            <div className="summary-box">

                                <FaCheckCircle

                                    color="#22c55e"

                                    size={28}

                                />

                                <span>

                                    Resolved

                                </span>

                                <h2>

                                    {

                                        displayAnalytics.resolved ||

                                        0

                                    }

                                </h2>

                            </div>

                            {/* ACTIVE */}

                            <div className="summary-box">

                                <FaExclamationTriangle

                                    color="#ef4444"

                                    size={28}

                                />

                                <span>

                                    Active

                                </span>

                                <h2>

                                    {

                                        displayAnalytics.unresolved ||

                                        0

                                    }

                                </h2>

                            </div>

                            {/* CONFIDENCE */}

                            <div className="summary-box">

                                <FaChartLine

                                    color="#2563eb"

                                    size={28}

                                />

                                <span>

                                    Avg Confidence

                                </span>

                                <h2>

                                    {

                                        displayAnalytics.averageConfidence ||

                                        0

                                    }%

                                </h2>

                            </div>

                            {/* MOST COMMON ATTACK */}

                            <div className="summary-box">

                                <FaBug

                                    color="#8b5cf6"

                                    size={28}

                                />

                                <span>

                                    Most Common Attack

                                </span>

                                <h2>

                                    {

                                        displayAnalytics.mostCommonAttack ||

                                        "None"

                                    }

                                </h2>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </MainLayout>

    );

}