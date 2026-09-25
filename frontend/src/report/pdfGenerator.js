import jsPDF from "jspdf";

import { drawCoverPage } from "./coverPage";
import { drawSummaryPage } from "./summaryPage";
import { drawAnalyticsPage } from "./analyticsPage";
import { drawIncidentsPage } from "./incidentsPage";
import { drawRecommendationPage } from "./recommendationPage";
import normalizeAnalytics from "./normalizeAnalytics";
import buildReportCharts from "./buildReportCharts";

export default async function generatePDF(analytics, incidents = []) {
    const normalized = normalizeAnalytics(analytics);
    const charts = buildReportCharts(normalized);

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    await drawCoverPage(doc, normalized);
    drawSummaryPage(doc, normalized);
    drawAnalyticsPage(doc, normalized, charts);
    drawIncidentsPage(doc, incidents);
    drawRecommendationPage(doc, normalized);

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

    doc.save(`DDoS_Guard_Report_${timestamp}.pdf`);
}
