import {
    drawFooter,
    drawHeader,
    drawInfoBox,
    drawPageBackground,
    drawSectionTitle,
    drawWatermark
} from "./pdfHelpers";
import { formatPercent } from "./normalizeAnalytics";

function drawChartImage(doc, image, x, y, width, height) {
    if (!image) return;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, width, height, 4, 4, "F");
    doc.setDrawColor(220);
    doc.roundedRect(x, y, width, height, 4, 4);
    doc.addImage(image, "PNG", x + 4, y + 4, width - 8, height - 8);
}

export function drawAnalyticsPage(doc, analytics, charts) {
    doc.addPage();

    drawPageBackground(doc);
    drawHeader(doc);
    drawWatermark(doc);

    drawSectionTitle(doc, "Analytics Dashboard", 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(
        "Real analytics captured at report generation time from live system data.",
        20,
        47
    );

    drawChartImage(doc, charts?.hourlyChart, 18, 56, 174, 58);

    drawChartImage(doc, charts?.attackTypesChart, 18, 120, 84, 58);
    drawChartImage(doc, charts?.weeklyChart, 108, 120, 84, 58);

    const effectiveness =
        analytics.averageEffectiveness ??
        analytics.mitigationEffectiveness ??
        analytics.averageConfidence;

    drawInfoBox(
        doc,
        20,
        186,
        80,
        36,
        "Incidents",
        `Total incidents: ${analytics.totalIncidents}\nResolved: ${analytics.resolved}\nActive: ${analytics.unresolved}`
    );

    drawInfoBox(
        doc,
        110,
        186,
        80,
        36,
        "Detection Metrics",
        `Avg latency: ${analytics.averageLatency} ms\nConfidence: ${formatPercent(analytics.averageConfidence)}\nEffectiveness: ${formatPercent(effectiveness)}`
    );

    drawInfoBox(
        doc,
        20,
        230,
        80,
        36,
        "Live Traffic",
        `Attacks detected: ${analytics.live?.attacksDetected ?? 0}\nNormal traffic: ${analytics.live?.normalTraffic ?? 0}\nPackets blocked: ${analytics.live?.packetsBlocked ?? 0}`
    );

    drawInfoBox(
        doc,
        110,
        230,
        80,
        36,
        "Top Threat",
        `Most common attack:\n${analytics.mostCommonAttack || "None"}`
    );

    drawFooter(doc, 3);
}
