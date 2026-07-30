import { useEffect, useState } from "react";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from "recharts";

export default function TrafficChart({ metrics }) {

    const [data, setData] = useState([]);

    useEffect(() => {

        const point = {

            time: new Date().toLocaleTimeString(),

            packets: metrics?.packets_sent || 0,

            attacks: metrics?.attacks_detected || 0

        };

        setData(prev => {

            const updated = [...prev, point];

            if (updated.length > 20) updated.shift();

            return updated;

        });

    }, [metrics]);

    return (

        <div className="chart-card">

            <h2>Live Traffic</h2>

            <ResponsiveContainer
                width="100%"
                height={320}
            >

                <AreaChart data={data}>

                    <defs>

                        <linearGradient
                            id="traffic"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >

                            <stop
                                offset="5%"
                                stopColor="#2ea8ff"
                                stopOpacity={0.9}
                            />

                            <stop
                                offset="95%"
                                stopColor="#2ea8ff"
                                stopOpacity={0.05}
                            />

                        </linearGradient>

                    </defs>

                    <CartesianGrid stroke="#22314a" />

                    <XAxis
                        dataKey="time"
                        tick={{ fill: "#9bb0c7", fontSize: 12 }}
                    />

                    <YAxis
                        tick={{ fill: "#9bb0c7" }}
                    />

                    <Tooltip />

                    <Area

                        type="monotone"

                        dataKey="packets"

                        stroke="#2ea8ff"

                        fill="url(#traffic)"

                        strokeWidth={3}

                    />

                </AreaChart>

            </ResponsiveContainer>

        </div>

    );

}