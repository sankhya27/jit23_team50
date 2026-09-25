// src/report/summaryPage.js

import {
    drawFooter,
    drawHeader,
    drawMetricCard,
    drawPageBackground,
    drawSectionTitle,
    drawWatermark
} from "./pdfHelpers";
import { formatPercent } from "./normalizeAnalytics";

export function drawSummaryPage(doc, analytics) {

    doc.addPage();

    drawPageBackground(doc);

    drawHeader(doc);

    drawWatermark(doc);

    drawSectionTitle(
        doc,
        "Executive Summary",
        36
    );

    doc.setFont("helvetica", "normal");

    doc.setFontSize(11);

    doc.setTextColor(100);

    doc.text(
        "Overview of incidents detected by the Machine Learning detection engine.",
        20,
        47
    );

    //------------------------------------------------

    const total =
        analytics?.totalIncidents || 0;

    const critical =
        analytics?.severity?.critical || 0;

    const high =
        analytics?.severity?.high || 0;

    const medium =
        analytics?.severity?.medium || 0;

    const low =
        analytics?.severity?.low || 0;

    const latency =
        analytics?.averageLatency || 0;

    const effectiveness =
        analytics?.averageEffectiveness ??
        analytics?.mitigationEffectiveness ??
        analytics?.averageConfidence ??
        null;

    //------------------------------------------------

    drawMetricCard(
        doc,
        20,
        58,
        80,
        40,
        "Total Incidents",
        total,
        [0,184,255]
    );

    drawMetricCard(
        doc,
        110,
        58,
        80,
        40,
        "Critical",
        critical,
        [239,68,68]
    );

    drawMetricCard(
        doc,
        20,
        108,
        80,
        40,
        "High",
        high,
        [245,158,11]
    );

    drawMetricCard(
        doc,
        110,
        108,
        80,
        40,
        "Medium",
        medium,
        [250,204,21]
    );

    drawMetricCard(
        doc,
        20,
        158,
        80,
        40,
        "Low",
        low,
        [34,197,94]
    );

    drawMetricCard(
        doc,
        110,
        158,
        80,
        40,
        "Detection Effectiveness",
        formatPercent(effectiveness),
        [37,99,235]
    );

    //------------------------------------------------

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(17);

    doc.setTextColor(7,26,45);

    doc.text(
        "Detection Engine",
        20,
        220
    );

    doc.setDrawColor(
        0,
        184,
        255
    );

    doc.line(
        20,
        224,
        100,
        224
    );

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(11);

    doc.setTextColor(80);

    doc.text(
        "Machine Learning Model : Random Forest",
        20,
        238
    );

    doc.text(
        `Average Detection Latency : ${latency} ms`,
        20,
        248
    );

    doc.text(
        `Detection Effectiveness : ${formatPercent(effectiveness)}`,
        20,
        258
    );

    doc.text(
        `Average Confidence : ${formatPercent(analytics?.averageConfidence)}`,
        20,
        268
    );

    doc.text(
        `Report Generated : ${new Date(analytics?.generatedAt || Date.now()).toLocaleString()}`,
        20,
        278
    );

    drawFooter(doc,2);

}