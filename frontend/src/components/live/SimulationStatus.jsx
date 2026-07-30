import { useEffect, useState } from "react";
import {
    FaPlayCircle,
    FaStopCircle,
    FaInfoCircle
} from "react-icons/fa";

const API = "http://localhost:5001/api";

export default function SimulationStatus() {

    const [running, setRunning] = useState(false);

    useEffect(() => {

        async function loadStatus() {

            try {

                const res = await fetch(`${API}/system-health`);

                const data = await res.json();

                setRunning(data.simulation_running);

            }

            catch {}

        }

        loadStatus();

        const timer = setInterval(loadStatus, 2000);

        return () => clearInterval(timer);

    }, []);

    return (

        <div className="chart-card">

            <h3>

                <FaInfoCircle />

                {" "}Simulation Status

            </h3>

            <div
                style={{
                    marginTop: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "18px",
                    fontWeight: 600
                }}
            >

                {

                    running ?

                    <>

                        <FaPlayCircle
                            color="#4ade80"
                            size={28}
                        />

                        <span>

                            Live Traffic Running

                        </span>

                    </>

                    :

                    <>

                        <FaStopCircle
                            color="#ef4444"
                            size={28}
                        />

                        <span>

                            Simulation Stopped

                        </span>

                    </>

                }

            </div>

            <p
                style={{
                    marginTop: "18px",
                    lineHeight: "1.7",
                    opacity: 0.8
                }}
            >

                Start or stop the traffic simulator from the
                <strong> Dashboard </strong>
                page.

                <br />

                This page automatically displays all incoming
                traffic, detected attacks, alerts and statistics.

            </p>

        </div>

    );

}