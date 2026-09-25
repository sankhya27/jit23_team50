
import { useEffect, useMemo, useState } from "react";

import MainLayout from "../components/layout/MainLayout";
import { getHistory } from "../api";

import "../styles/detectionHistory.css";

export default function DetectionHistory() {

    const [history, setHistory] = useState([]);

    const [summary, setSummary] = useState({
        totalPackets: 0,
        allowed: 0,
        blocked: 0
    });

    const [page, setPage] = useState(1);

    const rowsPerPage = 20;

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

            setSummary({
                totalPackets: data.totalPackets ?? data.totalRecords ?? 0,
                allowed: data.allowed ?? 0,
                blocked: data.blocked ?? 0
            });

        }

        catch (err) {

            console.log(err);

        }

    }

    const filtered = history.filter(item =>

        (item.sourceIP || "").toLowerCase().includes(search.toLowerCase()) ||

        (item.attackType || "").toLowerCase().includes(search.toLowerCase()) ||

        (item.username || "").toLowerCase().includes(search.toLowerCase())

    );

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / rowsPerPage)
    );

    const currentRows = useMemo(() =>
        filtered.slice(
            (page - 1) * rowsPerPage,
            page * rowsPerPage
        ),
        [filtered, page]
    );

    useEffect(() => {

        setPage(1);

    }, [search]);

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

                        <h2>{summary.totalPackets}</h2>

                        <p>Total Packets</p>

                    </div>

                    <div className="summary-card">

                        <h2>

                            {

                                summary.allowed

                            }

                        </h2>

                        <p>Allowed</p>

                    </div>

                    <div className="summary-card">

                        <h2>

                            {

                                summary.blocked

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

                            currentRows.map(item=>(

                                <tr key={item._id}>

                                    <td>

                                        {

                                            new Date(item.createdAt).toLocaleString()

                                        }

                                    </td>

                                    <td>{item.sourceIP}</td>

                                    <td>{item.attackType}</td>

                                    <td>

                                        {Math.round(
                                            (item.confidence <= 1
                                                ? item.confidence * 100
                                                : item.confidence) || 0
                                        )}%

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

                <div className="history-pagination">

                    <button
                        disabled={page === 1}
                        onClick={() => setPage(current => current - 1)}
                    >
                        Previous
                    </button>

                    <span>{page} / {totalPages}</span>

                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(current => current + 1)}
                    >
                        Next
                    </button>

                </div>

            </div>

        </MainLayout>

    );

}
