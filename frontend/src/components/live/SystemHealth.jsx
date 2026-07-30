import { useEffect, useState } from "react";

const API = "http://localhost:5001/api";

export default function SystemHealth({

    onHealthChange

}) {

    const [health, setHealth] = useState({
        api: "Loading...",
        mongodb: "Loading...",
        ml: "Loading...",
        email: "Loading...",
        simulation: "Loading..."
    });

    useEffect(() => {

        loadHealth();

        const timer = setInterval(loadHealth, 3000);

        return () => clearInterval(timer);

    }, []);

    async function loadHealth() {

        try {

            const token = localStorage.getItem("token");

            const res = await fetch(

                `${API}/system-health`,

                {

                    headers: {

                        Authorization: `Bearer ${token}`

                    }

                }

            );

            const data = await res.json();

            setHealth(data);
            onHealthChange && onHealthChange(data);

        }

        catch {

            setHealth({

                api: "Offline",

                mongodb: "Offline",

                ml: "Offline",

                email: "Offline",

                simulation: "Offline"

            });

        }

    }

    function dot(status){

        if(status==="Connected" ||
           status==="Healthy" ||
           status==="Running" ||
           status==="Online"){

            return "green";

        }

        return "red";

    }

    return(

        <div className="chart-card">

            <h3>

                🖥 System Health

            </h3>

            {

                Object.entries(health).map(([key,value])=>(

                    <div
                        className="health-row"
                        key={key}
                    >

                        <div>

                            {key.toUpperCase()}

                        </div>

                        <div
                            className={`health-dot ${dot(value)}`}
                        />

                        <strong>

                            {value}

                        </strong>

                    </div>

                ))

            }

        </div>

    );

}