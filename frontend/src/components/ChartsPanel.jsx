import { useEffect, useState } from "react";

import {
    AreaChart,
    Area,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend
} from "recharts";

export default function ChartsPanel({ metrics }) {

    const [history, setHistory] = useState([]);

    useEffect(() => {

        const previous =
            history.length > 0
                ? history[history.length - 1]
                : null;

        let attack = metrics.live_attack || 0;
        let normal = metrics.live_normal || 0;

        // ----------------------------
        // Smooth sudden drops
        // ----------------------------

        if (previous) {

            if (
                attack === 0 &&
                previous.attack > 100
            ) {
                attack = Math.floor(previous.attack * 0.85);
            }

            if (
                normal === 0 &&
                previous.normal > 100
            ) {
                normal = Math.floor(previous.normal * 0.90);
            }

        }

        const point = {

            time: new Date().toLocaleTimeString([], {

                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"

            }),

            normal,

            attack

        };

        setHistory(prev => {

            const updated = [...prev, point];

            if (updated.length > 40)
                updated.shift();

            return updated;

        });

    }, [metrics.live_normal, metrics.live_attack]);

    const totalTraffic =
        (metrics.live_normal || 0) +
        (metrics.live_attack || 0);

    return (

        <div className="charts-wrapper">

            <div className="analytics-summary">

                <div className="summary-card">

                    <span>Current Traffic</span>

                    <h2>{totalTraffic}</h2>

                </div>

                <div className="summary-card">

                    <span>Attack Packets</span>

                    <h2 className="danger">
                        {metrics.live_attack}
                    </h2>

                </div>

                <div className="summary-card">

                    <span>Normal Packets</span>

                    <h2 className="success">
                        {metrics.live_normal}
                    </h2>

                </div>

                <div className="summary-card">

                    <span>Mitigation Effectiveness</span>

                    <h2>
                        {metrics.mitigation_effectiveness_pct == null
                            ? "N/A"
                            : `${metrics.mitigation_effectiveness_pct}%`}
                    </h2>

                </div>

            </div>

            <div
                className="chart-card"
                id="live-network-chart"
            >

                <h3>
                    Live Network Traffic
                </h3>

                <ResponsiveContainer
                    width="100%"
                    height={320}
                >

                    <AreaChart data={history}>

                        <defs>

                            <linearGradient
                                id="normalTraffic"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >

                                <stop
                                    offset="5%"
                                    stopColor="#22c55e"
                                    stopOpacity={0.9}
                                />

                                <stop
                                    offset="95%"
                                    stopColor="#22c55e"
                                    stopOpacity={0}
                                />

                            </linearGradient>

                            <linearGradient
                                id="attackTraffic"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >

                                <stop
                                    offset="5%"
                                    stopColor="#ef4444"
                                    stopOpacity={0.9}
                                />

                                <stop
                                    offset="95%"
                                    stopColor="#ef4444"
                                    stopOpacity={0}
                                />

                            </linearGradient>

                        </defs>

                        <CartesianGrid
                            stroke="rgba(255,255,255,.08)"
                        />

                        <XAxis
                            dataKey="time"
                            stroke="#9fb4d9"
                        />

                        <YAxis
                            stroke="#9fb4d9"
                            allowDecimals={false}
                        />

                        <Tooltip
                            contentStyle={{
                                background: "#162338",
                                border: "none",
                                borderRadius: "12px",
                                color: "#fff"
                            }}
                        />

                        <Legend />

                        <Area
                            type="monotone"
                            dataKey="normal"
                            stroke="#22c55e"
                            fill="url(#normalTraffic)"
                            strokeWidth={3}
                            name="Normal Traffic"
                            isAnimationActive={true}
                        />

                        <Area
                            type="monotone"
                            dataKey="attack"
                            stroke="#ef4444"
                            fill="url(#attackTraffic)"
                            strokeWidth={3}
                            name="Attack Traffic"
                            isAnimationActive={true}
                        />

                    </AreaChart>

                </ResponsiveContainer>

            </div>

        </div>

    );

}