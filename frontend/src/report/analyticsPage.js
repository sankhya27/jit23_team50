// src/report/analyticsPage.js

import {
    drawFooter,
    drawHeader,
    drawInfoBox,
    drawPageBackground,
    drawSectionTitle,
    drawWatermark
} from "./pdfHelpers";

export function drawAnalyticsPage(
    doc,
    analytics,
    charts
) {

    doc.addPage();

    drawPageBackground(doc);

    drawHeader(doc);

    drawWatermark(doc);

    drawSectionTitle(
        doc,
        "Analytics Dashboard",
        36
    );

    doc.setFont("helvetica", "normal");

    doc.setFontSize(11);

    doc.setTextColor(100);

    doc.text(
        "Machine Learning based traffic analysis and detection statistics.",
        20,
        47
    );

    //----------------------------------------------------------
    // Live Network Chart
    //----------------------------------------------------------

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(15);

    doc.setTextColor(7,26,45);

    doc.text(
        "Live Network Activity",
        20,
        62
    );

    doc.setDrawColor(
        0,
        184,
        255
    );

    doc.line(
        20,
        65,
        90,
        65
    );

    if (charts?.networkChart) {

        doc.setFillColor(255,255,255);

        doc.roundedRect(
            18,
            72,
            174,
            95,
            4,
            4,
            "F"
        );

        doc.setDrawColor(220);

        doc.roundedRect(
            18,
            72,
            174,
            95,
            4,
            4
        );

        doc.addImage(

            charts.networkChart,

            "PNG",

            24,

            78,

            162,

            82

        );

    }

    else {

        drawInfoBox(

            doc,

            18,

            72,

            174,

            42,

            "Chart Status",

            "Dashboard chart not detected. Open the Dashboard and generate the report from there to include the live chart."

        );

    }

    //----------------------------------------------------------
    // Statistics
    //----------------------------------------------------------

    drawInfoBox(

        doc,

        20,

        180,

        80,

        40,

        "Incidents",

        `Total incidents detected : ${analytics.totalIncidents}`

    );

    drawInfoBox(

        doc,

        110,

        180,

        80,

        40,

        "Latency",

        `${analytics.averageLatency} ms average detection time`

    );

    drawInfoBox(

        doc,

        20,

        228,

        80,

        40,

        "Detection Accuracy",

        `${analytics.averageEffectiveness}% effectiveness`

    );

    drawInfoBox(

        doc,

        110,

        228,

        80,

        40,

        "ML Engine",

        "Random Forest Classifier\nStatus : Active"

    );

    //----------------------------------------------------------

    drawFooter(
        doc,
        3
    );

}