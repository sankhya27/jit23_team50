import { useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { useAuth } from "../context/AuthContext";
import "../styles/incidents.css";

const API = "http://localhost:5001/api";

export default function Incidents() {

    const { user } = useAuth();

    const [incidents, setIncidents] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [severity, setSeverity] =
        useState("All");

    const [status, setStatus] =
        useState("All");

    const [sort, setSort] =
        useState("Newest");

    const [page, setPage] =
        useState(1);

    const [selectedIncident, setSelectedIncident] =
        useState(null);

    const detailsRef =
        useRef(null);

    const [actionLoading, setActionLoading] =
        useState(null);

    const [exporting, setExporting] =
        useState(false);

    const rowsPerPage = 8;

    // ======================================================
    // LOAD INCIDENTS
    // ======================================================

    async function loadIncidents(
        showLoading = false,
        limit = 500,
        merge = false
    ) {

        try {

            if (showLoading) {

                setLoading(true);

            }

            setError("");

            const token =
                localStorage.getItem("token");

            if (!token) {

                setError(
                    "You are not logged in."
                );

                setIncidents([]);

                return;

            }

            const response =
                await fetch(
                    `${API}/incidents?limit=${limit}`,
                    {

                        method: "GET",

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }

                    }
                );

            if (!response.ok) {

                if (
                    response.status === 401
                ) {

                    throw new Error(
                        "Your session has expired. Please log in again."
                    );

                }

                if (
                    response.status === 403
                ) {

                    throw new Error(
                        "You are not authorized to view incidents."
                    );

                }

                throw new Error(
                    `Failed to load incidents (${response.status})`
                );

            }

            const data =
                await response.json();

            if (
                data &&
                Array.isArray(data.incidents)
            ) {

                setIncidents(previous => merge
                    ? mergeIncidents(previous, data.incidents)
                    : data.incidents
                );

                return data.incidents;

            }

            else if (
                Array.isArray(data)
            ) {

                // Compatibility with older backend response
                setIncidents(previous => merge
                    ? mergeIncidents(previous, data)
                    : data
                );

                return data;

            }

            else {

                setIncidents([]);

                return [];

            }

        }

        catch (err) {

            console.error(
                "Incident loading error:",
                err
            );

            setError(
                err.message ||
                "Unable to load incidents."
            );

        }

        finally {

            setLoading(false);

        }

    }

    function mergeIncidents(previous, incoming) {

        const byId = new Map(
            previous.map(item => [item._id, item])
        );

        incoming.forEach(item => {

            byId.set(item._id, item);

        });

        return [...byId.values()];

    }

    // ======================================================
    // INITIAL LOAD + AUTO REFRESH
    // ======================================================

    useEffect(() => {

        loadIncidents(true, 0);

        const timer =
            setInterval(() => {

                loadIncidents(false, 500, true);

            }, 5000);

        return () => {

            clearInterval(timer);

        };

    }, []);

    useEffect(() => {

        if (selectedIncident && detailsRef.current) {

            detailsRef.current.focus({
                preventScroll: true
            });

        }

    }, [selectedIncident]);

    // ======================================================
    // RESOLVE INCIDENT
    // ======================================================

    async function blockIncident(id) {

        if (!id) {

            return;

        }

        try {

            setActionLoading(id);

            setError("");

            const response =
                await fetch(
                    `${API}/incidents/${id}/block`,
                    {

                        method: "PATCH",

                        headers: {

                            Authorization:
                                `Bearer ${localStorage.getItem("token")}`

                        }

                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to block incident."
                );

            }

            setIncidents(previous =>
                previous.map(incident =>
                    incident._id === id
                        ? data.incident
                        : incident
                )
            );

            if (selectedIncident?._id === id) {

                setSelectedIncident(data.incident);

            }

        }

        catch (err) {

            setError(
                err.message ||
                "Unable to block incident."
            );

        }

        finally {

            setActionLoading(null);

        }

    }

    async function resolveIncident(id) {

        if (!id) {

            return;

        }

        try {

            setActionLoading(id);

            setError("");

            const token =
                localStorage.getItem("token");

            const response =
                await fetch(
                    `${API}/incidents/${id}/resolve`,
                    {

                        method: "PATCH",

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }

                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to resolve incident."
                );

            }

            // Update immediately in UI
            if (
                data.incident
            ) {

                setIncidents(
                    previous =>
                        previous.map(
                            incident =>
                                incident._id === id
                                    ? data.incident
                                    : incident
                        )
                );

                // Also update modal if open
                if (
                    selectedIncident?._id === id
                ) {

                    setSelectedIncident(
                        data.incident
                    );

                }

            }

            else {

                await loadIncidents(false);

            }

        }

        catch (err) {

            console.error(
                "Resolve incident error:",
                err
            );

            setError(
                err.message ||
                "Unable to resolve incident."
            );

        }

        finally {

            setActionLoading(null);

        }

    }

    // ======================================================
    // DELETE INCIDENT
    // ======================================================

    async function deleteIncident(id) {

        if (!id) {

            return;

        }

        const confirmed =
            window.confirm(
                "Delete this incident permanently?"
            );

        if (!confirmed) {

            return;

        }

        try {

            setActionLoading(id);

            setError("");

            const token =
                localStorage.getItem("token");

            const response =
                await fetch(
                    `${API}/incidents/${id}`,
                    {

                        method: "DELETE",

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }

                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to delete incident."
                );

            }

            setIncidents(
                previous =>
                    previous.filter(
                        incident =>
                            incident._id !== id
                    )
            );

            if (
                selectedIncident?._id === id
            ) {

                setSelectedIncident(null);

            }

        }

        catch (err) {

            console.error(
                "Delete incident error:",
                err
            );

            setError(
                err.message ||
                "Unable to delete incident."
            );

        }

        finally {

            setActionLoading(null);

        }

    }

    // ======================================================
    // FILTER + SORT
    // ======================================================

    function getFilteredIncidents(source) {

            let data =
                [...source];

            // --------------------------------------------------
            // SEARCH
            // --------------------------------------------------

            if (search.trim()) {

                const value =
                    search
                        .trim()
                        .toLowerCase();

                data =
                    data.filter(
                        item =>

                            item.attackType
                                ?.toLowerCase()
                                .includes(value)

                            ||

                            item.sourceIP
                                ?.toLowerCase()
                                .includes(value)

                            ||

                            item.username
                                ?.toLowerCase()
                                .includes(value)

                    );

            }

            // --------------------------------------------------
            // SEVERITY
            // --------------------------------------------------

            if (
                severity !== "All"
            ) {

                data =
                    data.filter(
                        item =>
                            String(item.severity || "")
                                .trim()
                                .toLowerCase() ===
                            severity.toLowerCase()
                    );

            }

            // --------------------------------------------------
            // STATUS
            // --------------------------------------------------

            if (
                status !== "All"
            ) {

                data =
                    data.filter(
                        item => {

                            return getStatus(item)
                                .toLowerCase() ===
                                status.toLowerCase();

                        }
                    );

            }

            // --------------------------------------------------
            // SORT
            // --------------------------------------------------

            data.sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.createdAt
                        ).getTime();

                    const dateB =
                        new Date(
                            b.createdAt
                        ).getTime();

                    if (
                        sort === "Newest"
                    ) {

                        return dateB - dateA;

                    }

                    return dateA - dateB;

                }
            );

            return data;

    }

    const filtered =
        useMemo(() => {

            return getFilteredIncidents(incidents);

        }, [

            incidents,

            search,

            severity,

            status,

            sort

        ]);

    // ======================================================
    // PAGINATION
    // ======================================================

    const totalPages =
        Math.ceil(
            filtered.length /
            rowsPerPage
        );

    const safeTotalPages =
        Math.max(
            totalPages,
            1
        );

    // Make sure current page doesn't
    // remain beyond available pages
    useEffect(() => {

        if (
            totalPages > 0 &&
            page > totalPages
        ) {

            setPage(totalPages);

        }

        if (
            totalPages === 0 &&
            page !== 1
        ) {

            setPage(1);

        }

    }, [
        totalPages,
        page
    ]);

    const currentRows =
        filtered.slice(

            (page - 1) *
                rowsPerPage,

            page *
                rowsPerPage

        );

    // ======================================================
    // EXPORT CSV
    // ======================================================

    async function exportCSV() {

        setExporting(true);

        const latestIncidents =
            await loadIncidents(false, 0);

        const exportIncidents =
            getFilteredIncidents(
                latestIncidents || []
            );

        if (exportIncidents.length === 0) {

            alert(
                "There are no incidents to export."
            );

            setExporting(false);

            return;

        }

        const rows = [

            [

                "Attack",

                "Severity",

                "Source IP",

                "Confidence",

                "Status",

                "Time"

            ]

        ];

        exportIncidents.forEach(
            item => {

                rows.push([

                    item.attackType ||
                        "Unknown",

                    item.severity ||
                        "medium",

                    item.sourceIP ||
                        "unknown",

                    Math.round(

                        (
                            item.detection
                                ?.confidence ||
                            0
                        ) * 100

                    ) + "%",

                    getStatus(item),

                    item.createdAt
                        ? new Date(
                            item.createdAt
                        ).toLocaleString()
                        : ""

                ]);

            }
        );

        // Escape CSV values properly
        const csv =
            rows
                .map(row =>

                    row
                        .map(value => {

                            const text =
                                String(
                                    value ?? ""
                                );

                            return `"${text.replace(
                                /"/g,
                                '""'
                            )}"`;

                        })
                        .join(",")

                )
                .join("\n");

        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );

        const url =
            window.URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        link.download =
            "incidents.csv";

        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );

        window.URL.revokeObjectURL(
            url
        );

        setExporting(false);

    }

    // ======================================================
    // FORMAT CONFIDENCE
    // ======================================================

    function formatConfidence(
        value
    ) {

        const number =
            Number(value);

        if (
            !Number.isFinite(number)
        ) {

            return "0%";

        }

        return (
            Math.round(
                number <= 1
                    ? number * 100
                    : number
            ) + "%"
        );

    }

    // ======================================================
    // STATUS
    // ======================================================

    function getStatus(
        incident
    ) {

        if (
            incident.status === "Resolved" ||
            incident.status === "Blocked" ||
            incident.status === "Detected"
        ) {

            return incident.status;

        }

        if (
            incident.resolved
        ) {

            return "Resolved";

        }

        if (
            incident.mitigation?.ipBlocked === true
        ) {

            return "Blocked";

        }

        return "Detected";

    }

    // ======================================================
    // RENDER
    // ======================================================

    return (

        <MainLayout>

            <div className="incidents-page">

                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="incident-header">

                    <div>

                        <h1>
                            Security Incidents
                        </h1>

                        <p>
                            View, filter and manage
                            detected security incidents.
                        </p>

                    </div>

                    <button
                        className="export-btn"
                        onClick={exportCSV}
                        disabled={exporting}
                    >

                        {exporting ? "Refreshing..." : "Export CSV"}

                    </button>

                </div>

                {/* ==========================================
                    ERROR
                ========================================== */}

                {error && (

                    <div
                        style={{
                            padding: "12px 15px",
                            marginBottom: "15px",
                            borderRadius: "8px",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            border: "1px solid #fecaca"
                        }}
                    >

                        {error}

                    </div>

                )}

                {/* ==========================================
                    TOOLBAR
                ========================================== */}

                <div className="incident-toolbar">

                    <input

                        type="text"

                        placeholder="Search attack, IP or user..."

                        value={search}

                        onChange={
                            event => {

                                setSearch(
                                    event.target.value
                                );

                                setPage(1);

                            }
                        }

                    />

                    <select

                        value={severity}

                        onChange={
                            event => {

                                setSeverity(
                                    event.target.value
                                );

                                setPage(1);

                            }
                        }

                    >

                        <option value="All">
                            All Severities
                        </option>

                        <option value="low">
                            Low
                        </option>

                        <option value="medium">
                            Medium
                        </option>

                        <option value="high">
                            High
                        </option>

                        <option value="critical">
                            Critical
                        </option>

                    </select>

                    <select

                        value={status}

                        onChange={
                            event => {

                                setStatus(
                                    event.target.value
                                );

                                setPage(1);

                            }
                        }

                    >

                        <option value="All">
                            All Status
                        </option>

                        <option value="Detected">
                            Detected
                        </option>

                        <option value="Blocked">
                            Blocked
                        </option>

                        <option value="Resolved">
                            Resolved
                        </option>

                    </select>

                    <select

                        value={sort}

                        onChange={
                            event => {

                                setSort(
                                    event.target.value
                                );

                                setPage(1);

                            }
                        }

                    >

                        <option value="Newest">
                            Newest
                        </option>

                        <option value="Oldest">
                            Oldest
                        </option>

                    </select>

                </div>

                {/* ==========================================
                    TABLE
                ========================================== */}

                {loading ? (

                    <p>
                        Loading incidents...
                    </p>

                ) : (

                    <table
                        className="incident-table"
                    >

                        <thead>

                            <tr>

                                <th>
                                    Attack
                                </th>

                                <th>
                                    Severity
                                </th>

                                <th>
                                    Source IP
                                </th>

                                <th>
                                    Confidence
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Time
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {currentRows.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        style={{
                                            textAlign:
                                                "center",
                                            padding:
                                                "40px"
                                        }}
                                    >

                                        No incidents found.

                                    </td>

                                </tr>

                            ) : (

                                currentRows.map(
                                    item => (

                                        <tr
                                            key={
                                                item._id
                                            }
                                        >

                                            <td>
                                                {
                                                    item.attackType ||
                                                    "Unknown"
                                                }
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        `severity ${
                                                            item.severity ||
                                                            "medium"
                                                        }`
                                                    }
                                                >

                                                    {
                                                        item.severity ||
                                                        "medium"
                                                    }

                                                </span>

                                            </td>

                                            <td>

                                                {
                                                    item.sourceIP ||
                                                    "unknown"
                                                }

                                            </td>

                                            <td>

                                                {
                                                    formatConfidence(
                                                        item.detection
                                                            ?.confidence
                                                    )
                                                }

                                            </td>

                                            <td>

                                                {
                                                    getStatus(
                                                        item
                                                    )
                                                }

                                            </td>

                                            <td>

                                                {
                                                    item.createdAt

                                                        ? new Date(
                                                            item.createdAt
                                                        ).toLocaleString()

                                                        : "Unknown"

                                                }

                                            </td>

                                            <td
                                                className={
                                                    "action-buttons"
                                                }
                                            >

                                                <button

                                                    className={
                                                        "view-btn"
                                                    }

                                                    onClick={() =>
                                                        setSelectedIncident(
                                                            item
                                                        )
                                                    }

                                                >

                                                    View

                                                </button>

                                                {user?.role ===
                                                    "admin" &&
                                                    !item.resolved &&
                                                    getStatus(item) === "Detected" && (

                                                        <button
                                                            className="block-btn"
                                                            disabled={actionLoading === item._id}
                                                            onClick={() => blockIncident(item._id)}
                                                        >
                                                            {actionLoading === item._id ? "Blocking..." : "Block"}
                                                        </button>

                                                    )}

                                                {user?.role ===
                                                    "admin" &&

                                                    !item.resolved && (

                                                        <button

                                                            className={
                                                                "resolve-btn"
                                                            }

                                                            disabled={
                                                                actionLoading ===
                                                                item._id
                                                            }

                                                            onClick={() =>
                                                                resolveIncident(
                                                                    item._id
                                                                )
                                                            }

                                                        >

                                                            {
                                                                actionLoading ===
                                                                item._id
                                                                    ? "Resolving..."
                                                                    : "Resolve"
                                                            }

                                                        </button>

                                                    )}

                                                {user?.role ===
                                                    "admin" && (

                                                    <button

                                                        className={
                                                            "delete-btn"
                                                        }

                                                        disabled={
                                                            actionLoading ===
                                                            item._id
                                                        }

                                                        onClick={() =>
                                                            deleteIncident(
                                                                item._id
                                                            )
                                                        }

                                                    >

                                                        {
                                                            actionLoading ===
                                                            item._id
                                                                ? "..."
                                                                : "Delete"
                                                        }

                                                    </button>

                                                )}

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                )}

                {/* ==========================================
                    PAGINATION
                ========================================== */}

                <div className="pagination">

                    <button

                        disabled={
                            page === 1
                        }

                        onClick={() =>
                            setPage(
                                previous =>
                                    Math.max(
                                        previous - 1,
                                        1
                                    )
                            )
                        }

                    >

                        Previous

                    </button>

                    <span>

                        {page} / {safeTotalPages}

                    </span>

                    <button

                        disabled={
                            page >=
                            totalPages ||
                            totalPages === 0
                        }

                        onClick={() =>
                            setPage(
                                previous =>
                                    Math.min(
                                        previous + 1,
                                        totalPages
                                    )
                            )
                        }

                    >

                        Next

                    </button>

                </div>

                {/* ==========================================
                    INCIDENT MODAL
                ========================================== */}

                {selectedIncident && (

                    <div
                        className={
                            "incident-modal-overlay"
                        }

                        onClick={event => {

                            if (
                                event.target ===
                                event.currentTarget
                            ) {

                                setSelectedIncident(
                                    null
                                );

                            }

                        }}

                    >

                        <div
                            className={
                                "incident-modal"
                            }

                            ref={detailsRef}

                            tabIndex="-1"

                            role="dialog"

                            aria-modal="true"
                        >

                            <div className="incident-modal-header">

                                <div>

                                    <span className="modal-eyebrow">
                                        Security event
                                    </span>

                                    <h2>
                                        Incident Details
                                    </h2>

                                </div>

                                <button
                                    className="modal-close-btn"
                                    onClick={() => setSelectedIncident(null)}
                                    aria-label="Close incident details"
                                >
                                    x
                                </button>

                            </div>

                            <div className="incident-modal-summary">

                                <span className="modal-attack-type">
                                    {selectedIncident.attackType || "Unknown"}
                                </span>

                                <span className={`severity ${selectedIncident.severity || "medium"}`}>
                                    {selectedIncident.severity || "medium"}
                                </span>

                            </div>

                            <p className="incident-detail-row">

                                <strong>
                                    Attack:
                                </strong>{" "}

                                {
                                    selectedIncident.attackType ||
                                    "Unknown"
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Severity:
                                </strong>{" "}

                                {
                                    selectedIncident.severity ||
                                    "medium"
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Source IP:
                                </strong>{" "}

                                {
                                    selectedIncident.sourceIP ||
                                    "unknown"
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Status:
                                </strong>{" "}

                                {
                                    getStatus(
                                        selectedIncident
                                    )
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Confidence:
                                </strong>{" "}

                                {
                                    formatConfidence(
                                        selectedIncident.detection
                                            ?.confidence
                                    )
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Latency:
                                </strong>{" "}

                                {
                                    selectedIncident.detection
                                        ?.latencyMs ??
                                    0
                                } ms

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    ML Score:
                                </strong>{" "}

                                {
                                    selectedIncident.detection
                                        ?.mlScore ??
                                    0
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Heuristic Score:
                                </strong>{" "}

                                {
                                    selectedIncident.detection
                                        ?.heuristicScore ??
                                    0
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Anomaly Score:
                                </strong>{" "}

                                {
                                    selectedIncident.detection
                                        ?.anomalyScore ??
                                    0
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Ensemble Score:
                                </strong>{" "}

                                {
                                    selectedIncident.detection
                                        ?.ensembleScore ??
                                    0
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Packet Rate:
                                </strong>{" "}

                                {
                                    selectedIncident.trafficData
                                        ?.packetRate ??
                                    0
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Duration:
                                </strong>{" "}

                                {
                                    selectedIncident.trafficData
                                        ?.duration ??
                                    0
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Byte Count:
                                </strong>{" "}

                                {
                                    selectedIncident.trafficData
                                        ?.byteCount ??
                                    0
                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Actions:
                                </strong>{" "}

                                {
                                    (
                                        selectedIncident
                                            .mitigation
                                            ?.actionsTaken ||
                                        []
                                    ).length > 0

                                        ? (
                                            selectedIncident
                                                .mitigation
                                                .actionsTaken
                                        ).join(", ")

                                        : "None"

                                }

                            </p>

                            <p className="incident-detail-row">

                                <strong>
                                    Created:
                                </strong>{" "}

                                {
                                    selectedIncident.createdAt

                                        ? new Date(
                                            selectedIncident.createdAt
                                        ).toLocaleString()

                                        : "Unknown"

                                }

                            </p>

                            {selectedIncident.resolved && (

                                <p>

                                    <strong>
                                        Resolved By:
                                    </strong>{" "}

                                    {
                                        selectedIncident.resolvedBy ||
                                        "Unknown"
                                    }

                                </p>

                            )}

                            <button
                                className="close-btn"

                                onClick={() =>
                                    setSelectedIncident(
                                        null
                                    )
                                }

                            >

                                Close

                            </button>

                        </div>

                    </div>

                )}

            </div>

        </MainLayout>

    );

}