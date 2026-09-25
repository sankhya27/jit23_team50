// src/report/recommendationPage.js

import {
    drawFooter,
    drawHeader,
    drawInfoBox,
    drawPageBackground,
    drawSectionTitle,
    drawWatermark
} from "./pdfHelpers";
import { formatPercent } from "./normalizeAnalytics";

export function drawRecommendationPage(doc, analytics = {}) {

    const unresolved =
        Number(analytics.unresolved) ||
        0;

    const critical =
        Number(analytics.severity?.critical) ||
        0;

    const threatLevel =
        critical > 0
            ? "Critical"
            : unresolved > 0
                ? "Elevated"
                : "No unresolved incidents";

    const recommendations = unresolved > 0
        ? "Review unresolved incidents and their mitigation actions.\n\nInvestigate repeated malicious source IP addresses.\n\nReview mitigation effectiveness after every attack."
        : "No unresolved incidents were returned by the report data.\n\nContinue monitoring incoming traffic and review new incidents as they arrive.";

    doc.addPage();

    drawPageBackground(doc);

    drawHeader(doc);

    drawWatermark(doc);

    drawSectionTitle(
        doc,
        "Security Assessment & Recommendations",
        36
    );

    //-------------------------------------------------------

    doc.setFont("helvetica", "normal");

    doc.setFontSize(11);

    doc.setTextColor(100);

    doc.text(
        "Final assessment generated using Machine Learning based traffic analysis.",
        20,
        47
    );

    //-------------------------------------------------------
    // Overall Health
    //-------------------------------------------------------

    drawInfoBox(

        doc,

        20,

        60,

        170,

        40,

        "Overall System Health",

        `Incident Status : ${unresolved} unresolved

    Critical Incidents : ${critical}

Detection Effectiveness : ${formatPercent(
        analytics.averageEffectiveness ??
        analytics.mitigationEffectiveness ??
        analytics.averageConfidence
    )}

Average Detection Latency : ${analytics.averageLatency || 0} ms`

    );

    //-------------------------------------------------------
    // Risk Assessment
    //-------------------------------------------------------

    drawInfoBox(

        doc,

        20,

        110,

        170,

        52,

        "Risk Assessment",

        `Current Threat Level : ${threatLevel}

    Total Incidents : ${analytics.totalIncidents || 0}

    Total Detections : ${analytics.totalDetections || 0}

    Most Common Attack : ${analytics.mostCommonAttack || "None"}`

    );

    //-------------------------------------------------------
    // Recommendations
    //-------------------------------------------------------

    drawInfoBox(

        doc,

        20,

        172,

        170,

        86,

        "Recommended Actions",

    recommendations

    );

    //-------------------------------------------------------
    // Final Status Banner
    //-------------------------------------------------------

    doc.setFillColor(
        unresolved > 0
            ? 217
            : 16,
        unresolved > 0
            ? 119
            : 185,
        unresolved > 0
            ? 6
            : 129
    );

    doc.roundedRect(

        20,

        266,

        170,

        15,

        3,

        3,

        "F"

    );

    doc.setFont(

        "helvetica",

        "bold"

    );

    doc.setFontSize(12);

    doc.setTextColor(255);

    doc.text(

        `Overall Assessment : ${unresolved > 0 ? "ACTION REQUIRED" : "NO UNRESOLVED INCIDENTS"}`,

        105,

        276,

        {

            align:"center"

        }

    );

    //-------------------------------------------------------

    drawFooter(doc,5);

}