
import { useEffect, useState } from "react";

import MainLayout from "../components/layout/MainLayout";
import { getHistory } from "../api";

import "../styles/detectionHistory.css";

export default function DetectionHistory() {

    const [history, setHistory] = useState([]);

    const [search, setSearch] = useState("");

    useEffect(() => {

        loadHistory();

        const timer = setInterval(loadHistory, 3000);

        return () => clearInterval(timer);

    }, []);

    async function loadHistory() {

        try {

            const data = await getHistory();

            setHistory(data.history || []);

        }

        catch (err) {

            console.log(err);

        }

    }

    const filtered = history.filter(item =>

        item.sourceIP.toLowerCase().includes(search.toLowerCase()) ||

        item.attackType.toLowerCase().includes(search.toLowerCase()) ||

        item.username.toLowerCase().includes(search.toLowerCase())

    );

    return (

        <MainLayout>

            <div className="history-page">

                <div className="history-top">

                    <h1>Detection History</h1>

                    <input

                        placeholder="Search by IP / Attack / User"

                        value={search}

                        onChange={(e)=>setSearch(e.target.value)}

                    />

                </div>

                <div className="history-summary">

                    <div className="summary-card">

                        <h2>{history.length}</h2>

                        <p>Total Packets</p>

                    </div>

                    <div className="summary-card">

                        <h2>

                            {

                                history.filter(x=>x.decision==="Allowed").length

                            }

                        </h2>

                        <p>Allowed</p>

                    </div>

                    <div className="summary-card">

                        <h2>

                            {

                                history.filter(x=>x.decision==="Blocked").length

                            }

                        </h2>

                        <p>Blocked</p>

                    </div>

                </div>

                <table className="history-table">

                    <thead>

                        <tr>

                            <th>Time</th>

                            <th>Source IP</th>

                            <th>Attack</th>

                            <th>Confidence</th>

                            <th>Decision</th>

                            <th>Latency</th>

                            <th>User</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            filtered.map(item=>(

                                <tr key={item._id}>

                                    <td>

                                        {

                                            new Date(item.createdAt).toLocaleString()

                                        }

                                    </td>

                                    <td>{item.sourceIP}</td>

                                    <td>{item.attackType}</td>

                                    <td>

                                        {

                                            Math.round(item.confidence*100)

                                        }%

                                    </td>

                                    <td>

                                        <span

                                            className={

                                                item.decision==="Blocked"

                                                ?

                                                "blocked"

                                                :

                                                "allowed"

                                            }

                                        >

                                            {item.decision}

                                        </span>

                                    </td>

                                    <td>

                                        {item.latencyMs} ms

                                    </td>

                                    <td>

                                        {item.username}

                                    </td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            </div>

        </MainLayout>

    );

}
