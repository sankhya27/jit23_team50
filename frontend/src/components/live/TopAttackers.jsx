import { useEffect, useState } from "react";

const API = "http://localhost:5001/api";

export default function TopAttackers() {

    const [ips, setIps] = useState([]);

    useEffect(() => {

        loadAttackers();

        const timer = setInterval(loadAttackers, 3000);

        return () => clearInterval(timer);

    }, []);

    async function loadAttackers() {

        try {

            const token = localStorage.getItem("token");

            const res = await fetch(

                `${API}/analytics`,

                {

                    headers: {

                        Authorization: `Bearer ${token}`

                    }

                }

            );

            if (!res.ok)
                return;

            const data = await res.json();

            const sorted = (data.topAttackers || [])
                .map(item => ({
                    ip: item.ip,
                    count: item.attacks
                }));

            setIps(sorted);

        }

        catch (err) {

            console.log(err);

        }

    }

    return (

        <div className="chart-card">

            <h3>

                🛡 Top Attacker IPs

            </h3>

            {

                ips.length === 0 ?

                    <p>No attacks yet.</p>

                    :

                    ips.map((item, index) => (

                        <div

                            className="attacker-row"

                            key={item.ip}

                        >

                            <div>

                                {

                                    index === 0 ?

                                        "🥇"

                                        :

                                        index === 1 ?

                                            "🥈"

                                            :

                                            index === 2 ?

                                                "🥉"

                                                :

                                                "•"

                                }

                            </div>

                            <div className="attacker-ip">

                                {item.ip}

                            </div>

                            <div className="attacker-count">

                                {item.count}

                            </div>

                        </div>

                    ))

            }

        </div>

    );

}