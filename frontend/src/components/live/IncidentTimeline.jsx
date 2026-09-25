import { useEffect, useState } from "react";

const API = "http://localhost:5001/api";
const ROWS_PER_PAGE = 8;

export default function IncidentTimeline() {

    const [incidents, setIncidents] = useState([]);
    const [page, setPage] = useState(1);

    useEffect(() => {

        load();

        const timer = setInterval(load, 3000);

        return () => clearInterval(timer);

    }, []);

    async function load() {

        try {

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${API}/incidents?limit=500`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    cache: "no-store"
                }
            );

            if (!res.ok) return;

            const data = await res.json();
            setIncidents(data.incidents || []);

        }

        catch (err) {

            console.error("Incident timeline error:", err);

        }

    }

    function color(level) {

        switch (String(level || "").toLowerCase()) {

            case "critical": return "#ef4444";
            case "high": return "#f97316";
            case "medium": return "#eab308";
            default: return "#22c55e";

        }

    }

    const totalPages = Math.max(
        1,
        Math.ceil(incidents.length / ROWS_PER_PAGE)
    );

    const currentRows = incidents.slice(
        (page - 1) * ROWS_PER_PAGE,
        page * ROWS_PER_PAGE
    );

    useEffect(() => {

        if (page > totalPages) setPage(totalPages);

    }, [page, totalPages]);

    return (

        <div className="chart-card timeline-card">

            <div className="timeline-heading">

                <div>
                    <span className="card-eyebrow">Latest events</span>
                    <h3>Incident Timeline</h3>
                </div>

                <span className="timeline-count">{incidents.length} loaded</span>

            </div>

            {!incidents.length ? (

                <p className="timeline-empty">No incidents yet.</p>

            ) : (

                <>

                    <div className="timeline-list">

                        {currentRows.map(item => (

                            <div className="timeline-item" key={item._id}>

                                <div
                                    className="timeline-dot"
                                    style={{ background: color(item.severity) }}
                                />

                                <div className="timeline-info">
                                    <strong>{item.attackType || "Unknown"}</strong>
                                    <span>{(item.severity || "unknown").toUpperCase()}</span>
                                </div>

                                <small>
                                    {item.createdAt
                                        ? new Date(item.createdAt).toLocaleTimeString()
                                        : "Unknown"}
                                </small>

                            </div>

                        ))}

                    </div>

                    <div className="timeline-pagination">

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

                </>

            )}

        </div>

    );

}