
import { useEffect, useMemo, useState, useCallback, useRef } from "react";

import MainLayout from "../components/layout/MainLayout";

import generatePDF from "../report/pdfGenerator";

import {
    FaFilePdf,
    FaFileCsv,
    FaCalendarAlt,
    FaBug,
    FaShieldAlt,
    FaClock,
    FaDownload,
    FaSearch,
    FaFilter,
    FaSyncAlt
} from "react-icons/fa";

import "../styles/reports.css";

const API = "http://localhost:5001/api";

const AUTO_REFRESH_INTERVAL = 5000;

function authHeader() {

    const token = localStorage.getItem("token");

    return {
        Authorization: `Bearer ${token}`
    };

}

function filterIncidents(
    source,
    severity,
    attack,
    query
) {

    const normalizedQuery = query.toLowerCase();

    return source.filter(item => {

        const sourceIP =
            item.sourceIP ||
            item.source_ip ||
            "";

        const itemSeverity =
            String(item.severity || "")
                .trim()
                .toLowerCase();

        return (
            (
                severity === "All" ||
                itemSeverity === severity.toLowerCase()
            ) &&
            (
                attack === "All" ||
                item.attackType === attack
            ) &&
            (
                item.attackType?.toLowerCase().includes(normalizedQuery) ||
                sourceIP.toLowerCase().includes(normalizedQuery)
            )
        );

    });

}

function csvCell(value) {

    const text =
        value == null
            ? ""
            : String(value);

    return `"${text.replace(/"/g, '""')}"`;

}

export default function Reports() {

    const [analytics, setAnalytics] = useState({

        totalIncidents: 0,

        averageConfidence: 0,

        averageLatency: 0,

        resolved: 0,

        unresolved: 0,

        mostCommonAttack: "None",

        severity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        }

    });

    const [incidents, setIncidents] = useState([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [exporting, setExporting] = useState("");

    const [error, setError] = useState("");

    const [lastGenerated, setLastGenerated] = useState("-");

    const [severityFilter, setSeverityFilter] = useState("All");

    const [attackFilter, setAttackFilter] = useState("All");

    const [search, setSearch] = useState("");

    const [reportPage, setReportPage] = useState(1);

    const REPORT_ROWS_PER_PAGE = 20;

    // Prevent concurrent background refreshes.

    const requestInProgress = useRef(false);

    // Prevent state updates if the component unmounts.

    const mounted = useRef(false);

    // ======================================================
    // LOAD REPORT DATA
    // ======================================================

    const loadData = useCallback(async (showLoading = true) => {

        if (requestInProgress.current) {

            return null;

        }

        requestInProgress.current = true;

        if (mounted.current && showLoading) {

            setLoading(true);

        }

        if (mounted.current) {

            setRefreshing(true);

        }

        try {

            const headers = authHeader();

            // --------------------------------------------------
            // FETCH ANALYTICS
            // --------------------------------------------------

            const analyticsRes = await fetch(

                `${API}/analytics`,

                {
                    headers,
                    cache: "no-store"
                }

            );

            if (!analyticsRes.ok) {

                throw new Error(
                    `Analytics request failed (${analyticsRes.status}).`
                );

            }

            const analyticsData =
                await analyticsRes.json();

            if (analyticsData.success === false) {

                throw new Error(
                    analyticsData.error ||
                    "Could not load analytics."
                );

            }

            // --------------------------------------------------
            // FETCH INCIDENTS
            // --------------------------------------------------

            const incidentRes = await fetch(

                `${API}/incidents?limit=0`,

                {
                    headers,
                    cache: "no-store"
                }

            );

            if (!incidentRes.ok) {

                throw new Error(
                    `Incident request failed (${incidentRes.status}).`
                );

            }

            const incidentData =
                await incidentRes.json();

            if (incidentData.success === false) {

                throw new Error(
                    incidentData.error ||
                    "Could not load incidents."
                );

            }

            const latestIncidents =

                Array.isArray(incidentData)

                    ? incidentData

                    : Array.isArray(incidentData.incidents)

                        ? incidentData.incidents

                        : null;

            if (!latestIncidents) {

                throw new Error(
                    "The incidents API returned an unexpected response."
                );

            }

            // --------------------------------------------------
            // UPDATE DATA ONLY AFTER BOTH REQUESTS SUCCEED
            // --------------------------------------------------

            if (mounted.current) {

                setAnalytics(analyticsData);

                setIncidents(latestIncidents);

                setError("");

            }

            return {

                analytics: analyticsData,

                incidents: latestIncidents

            };

        }

        catch (err) {

            console.error(
                "Reports data refresh failed:",
                err
            );

            if (mounted.current) {

                setError(

                    err.message ||
                    "Could not load report data."

                );

            }

            return null;

        }

        finally {

            requestInProgress.current = false;

            if (mounted.current) {

                setLoading(false);

                setRefreshing(false);

            }

        }

    }, []);

    // ======================================================
    // INITIAL LOAD AND AUTOMATIC REFRESH
    // ======================================================

    useEffect(() => {

        mounted.current = true;

        loadData(true);

        const refreshInterval = setInterval(() => {

            loadData(false);

        }, AUTO_REFRESH_INTERVAL);

        return () => {

            mounted.current = false;

            clearInterval(refreshInterval);

        };

    }, [loadData]);

    // ======================================================
    // MANUAL REFRESH
    // ======================================================

    async function refreshData() {

        return loadData(false);

    }

    // ======================================================
    // GENERATE PDF REPORT
    // ======================================================

    async function generateReport() {

        if (exporting) {

            return;

        }

        setExporting("pdf");

        try {

            const latest =
                await refreshData();

            if (!latest) {

                return;

            }

            await generatePDF(

                latest.analytics,

                filterIncidents(

                    latest.incidents,

                    severityFilter,

                    attackFilter,

                    search

                )

            );

            setLastGenerated(

                new Date().toLocaleString()

            );

        }

        catch (err) {

            console.error(
                "PDF generation failed:",
                err
            );

            setError(
                err.message ||
                "Could not generate the PDF report."
            );

        }

        finally {

            setExporting("");

        }

    }

    // ======================================================
    // EXPORT CSV
    // ======================================================

    async function exportCSV() {

        if (exporting) {

            return;

        }

        setExporting("csv");

        try {

            const latest =
                await refreshData();

            if (!latest) {

                return;

            }

            const rows = [

                [

                    "Attack Type",

                    "Severity",

                    "Source IP",

                    "Confidence",

                    "Status",

                    "Date"

                ]

            ];

            filterIncidents(

                latest.incidents,

                severityFilter,

                attackFilter,

                search

            ).forEach(item => {

                rows.push([

                    item.attackType,

                    item.severity,

                    item.sourceIP ||

                    item.source_ip ||

                    "-",

                    Math.round(

                        (item.detection?.confidence || 0) *

                        100

                    ) + "%",

                    item.resolved

                        ? "Resolved"

                        : "Active",

                    new Date(

                        item.createdAt

                    ).toLocaleString()

                ]);

            });

            const csv = rows

                .map(row => row.map(csvCell).join(","))

                .join("\n");

            const blob = new Blob(

                [csv],

                {
                    type: "text/csv;charset=utf-8;"
                }

            );

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                `Security_Report_${Date.now()}.csv`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            URL.revokeObjectURL(url);

            setLastGenerated(

                new Date().toLocaleString()

            );

        }

        catch (err) {

            console.error(
                "CSV export failed:",
                err
            );

            setError(
                err.message ||
                "Could not export the CSV report."
            );

        }

        finally {

            setExporting("");

        }

    }

    // ======================================================
    // ATTACK OPTIONS
    // ======================================================

    const attackOptions = useMemo(() => {

        const options = new Set();

        incidents.forEach(item => {

            if (item.attackType) {

                options.add(item.attackType);

            }

        });

        return [...options];

    }, [incidents]);

    // ======================================================
    // FILTERED INCIDENTS
    // ======================================================

    const filteredIncidents = useMemo(() => {

        return filterIncidents(

            incidents,

            severityFilter,

            attackFilter,

            search

        );

    }, [

        incidents,

        severityFilter,

        attackFilter,

        search

    ]);

    // ======================================================
    // KEEP PAGINATION VALID AFTER FILTERING OR REFRESHING
    // ======================================================

    const totalPages = Math.max(

        1,

        Math.ceil(

            filteredIncidents.length /

            REPORT_ROWS_PER_PAGE

        )

    );

    useEffect(() => {

        setReportPage(currentPage =>

            Math.min(

                currentPage,

                totalPages

            )

        );

    }, [totalPages]);

    // ======================================================
    // LOADING SCREEN
    // ======================================================

    if (loading) {

        return (

            <MainLayout>

                <div className="reports-page">

                    <h2>

                        Loading Reports...

                    </h2>

                </div>

            </MainLayout>

        );

    }

    // ======================================================
    // REPORTS PAGE
    // ======================================================

    return (

        <MainLayout>

            <div className="reports-page">

                <div className="reports-header">

                    <div>

                        <h1>

                            Security Reports Center

                        </h1>

                        <p>

                            Generate professional security reports, export
                            analytics and review incident history.

                        </p>

                    </div>

                    <button
                        className="refresh-btn"
                        onClick={refreshData}
                        disabled={refreshing}
                    >

                        <FaSyncAlt
                            className={refreshing ? "spin" : ""}
                        />

                        {refreshing
                            ? "Refreshing"
                            : "Refresh data"}

                    </button>

                </div>

                {error && (

                    <div
                        className="reports-error"
                        role="alert"
                    >

                        {error}

                    </div>

                )}

                <div className="reports-kpis">

                    <div className="report-card">

                        <div className="report-icon blue">

                            <FaBug />

                        </div>

                        <div>

                            <span>Total Incidents</span>

                            <h2>

                                {analytics.totalIncidents ?? 0}

                            </h2>

                        </div>

                    </div>

                    <div className="report-card">

                        <div className="report-icon green">

                            <FaShieldAlt />

                        </div>

                        <div>

                            <span>

                                Avg Confidence

                            </span>

                            <h2>

                                {analytics.averageConfidence ?? 0}%

                            </h2>

                        </div>

                    </div>

                    <div className="report-card">

                        <div className="report-icon orange">

                            <FaClock />

                        </div>

                        <div>

                            <span>

                                Avg Latency

                            </span>

                            <h2>

                                {analytics.averageLatency ?? 0} ms

                            </h2>

                        </div>

                    </div>

                    <div className="report-card">

                        <div className="report-icon purple">

                            <FaCalendarAlt />

                        </div>

                        <div>

                            <span>

                                Last Generated

                            </span>

                            <h3>

                                {lastGenerated}

                            </h3>

                        </div>

                    </div>

                </div>

                <div
                    className="severity-summary"
                    aria-label="Incident severity distribution"
                >

                    {["critical", "high", "medium", "low"].map(level => (

                        <div
                            className={`severity-count ${level}`}
                            key={level}
                        >

                            <span>{level}</span>

                            <strong>

                                {analytics.severity?.[level] ?? 0}

                            </strong>

                        </div>

                    ))}

                </div>

                <div className="report-toolbar">

                    <div className="search-box">

                        <FaSearch />

                        <input
                            type="text"
                            placeholder="Search attack or IP..."
                            value={search}
                            onChange={e => {

                                setSearch(e.target.value);

                                setReportPage(1);

                            }}
                        />

                    </div>

                    <div className="filter-box">

                        <FaFilter />

                        <select
                            value={severityFilter}
                            onChange={e => {

                                setSeverityFilter(e.target.value);

                                setReportPage(1);

                            }}
                        >

                            <option>All</option>

                            <option>low</option>

                            <option>medium</option>

                            <option>high</option>

                            <option>critical</option>

                        </select>

                    </div>

                    <div className="filter-box">

                        <FaBug />

                        <select
                            value={attackFilter}
                            onChange={e => {

                                setAttackFilter(e.target.value);

                                setReportPage(1);

                            }}
                        >

                            <option>All</option>

                            {attackOptions.map(item => (

                                <option key={item}>

                                    {item}

                                </option>

                            ))}

                        </select>

                    </div>

                </div>

                <div className="export-buttons">

                    <button
                        className="pdf-btn"
                        onClick={generateReport}
                        disabled={Boolean(exporting)}
                    >

                        <FaFilePdf />

                        {exporting === "pdf"
                            ? "Refreshing & generating..."
                            : "Generate PDF"}

                    </button>

                    <button
                        className="csv-btn"
                        onClick={exportCSV}
                        disabled={Boolean(exporting)}
                    >

                        <FaFileCsv />

                        {exporting === "csv"
                            ? "Refreshing & exporting..."
                            : "Export CSV"}

                    </button>

                </div>

                <div className="report-preview">

                    <h2>

                        Report Preview

                    </h2>

                    <table className="reports-table">

                        <thead>

                            <tr>

                                <th>Attack</th>

                                <th>Severity</th>

                                <th>Source IP</th>

                                <th>Confidence</th>

                                <th>Status</th>

                                <th>Date</th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredIncidents

                                .slice(

                                    (reportPage - 1) *
                                    REPORT_ROWS_PER_PAGE,

                                    reportPage *
                                    REPORT_ROWS_PER_PAGE

                                )

                                .map(item => (

                                    <tr key={item._id}>

                                        <td>

                                            {item.attackType}

                                        </td>

                                        <td>

                                            <span
                                                className={`severity-pill ${item.severity}`}
                                            >

                                                {item.severity || "unknown"}

                                            </span>

                                        </td>

                                        <td>

                                            {item.sourceIP ||

                                                item.source_ip ||

                                                "-"}

                                        </td>

                                        <td>

                                            {Math.round(

                                                (item.detection?.confidence || 0) *

                                                100

                                            )}%

                                        </td>

                                        <td>

                                            {item.resolved

                                                ? "Resolved"

                                                : "Active"}

                                        </td>

                                        <td>

                                            {new Date(

                                                item.createdAt

                                            ).toLocaleString()}

                                        </td>

                                    </tr>

                                ))}

                        </tbody>

                    </table>

                    {filteredIncidents.length > REPORT_ROWS_PER_PAGE && (

                        <div
                            className="pagination"
                            style={{ marginTop: "16px" }}
                        >

                            <button
                                disabled={reportPage === 1}
                                onClick={() => {

                                    setReportPage(page => page - 1);

                                }}
                            >

                                Previous

                            </button>

                            <span>

                                {reportPage} / {totalPages}

                            </span>

                            <button
                                disabled={reportPage >= totalPages}
                                onClick={() => {

                                    setReportPage(page => page + 1);

                                }}
                            >

                                Next

                            </button>

                        </div>

                    )}

                </div>

                <div className="reports-footer">

                    <div className="footer-card">

                        <h3>

                            Report Summary

                        </h3>

                        <div className="summary-row">

                            <span>

                                Total Records

                            </span>

                            <strong>

                                {filteredIncidents.length}

                            </strong>

                        </div>

                        <div className="summary-row">

                            <span>

                                Resolved Incidents

                            </span>

                            <strong>

                                {analytics.resolved ?? 0}

                            </strong>

                        </div>

                        <div className="summary-row">

                            <span>

                                Active Incidents

                            </span>

                            <strong>

                                {analytics.unresolved ?? 0}

                            </strong>

                        </div>

                        <div className="summary-row">

                            <span>

                                Most Common Attack

                            </span>

                            <strong>

                                {analytics.mostCommonAttack || "None"}

                            </strong>

                        </div>

                    </div>

                    <div className="footer-card">

                        <h3>

                            Recent Report Activity

                        </h3>

                        <div className="activity-item">

                            <FaDownload />

                            <span>

                                PDF reports include complete attack
                                statistics, confidence scores and system
                                health information.

                            </span>

                        </div>

                        <div className="activity-item">

                            <FaFileCsv />

                            <span>

                                CSV exports are compatible with Excel,
                                Google Sheets and Power BI.

                            </span>

                        </div>

                        <div className="activity-item">

                            <FaShieldAlt />

                            <span>

                                Reports are generated directly from the
                                latest security events stored in the
                                database.

                            </span>

                        </div>

                        <div className="activity-item">

                            <FaCalendarAlt />

                            <span>

                                Last Report Generated :

                                <strong>

                                    {" "}

                                    {lastGenerated}

                                </strong>

                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </MainLayout>

    );

}
