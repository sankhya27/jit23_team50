// src/report/recommendationPage.js

import {
    drawFooter,
    drawHeader,
    drawInfoBox,
    drawPageBackground,
    drawSectionTitle,
    drawWatermark
} from "./pdfHelpers";

export function drawRecommendationPage(doc, analytics = {}) {

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

        `System Status : Secure

ML Detection Engine : Active

Detection Effectiveness : ${analytics.averageEffectiveness || 0}%

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

        `Current Threat Level : Moderate

Network Monitoring : Active

Incident Response : Automated

Machine Learning Model : Random Forest`

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

`• Continue real-time traffic monitoring.

• Update firewall rules regularly.

• Retrain the ML model periodically with new traffic datasets.

• Enable email alerts for critical incidents.

• Investigate repeated malicious source IP addresses.

• Perform weekly security audits.

• Maintain backup and disaster recovery plans.

• Review mitigation effectiveness after every attack.`

    );

    //-------------------------------------------------------
    // Final Status Banner
    //-------------------------------------------------------

    doc.setFillColor(16,185,129);

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

        "Overall Assessment : SYSTEM SECURE & ML ENGINE OPERATIONAL",

        105,

        276,

        {

            align:"center"

        }

    );

    //-------------------------------------------------------

    drawFooter(doc,5);

}