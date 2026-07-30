// src/report/pdfGenerator.js

import jsPDF from "jspdf";

import { drawCoverPage } from "./coverPage";
import { drawSummaryPage } from "./summaryPage";
import { drawAnalyticsPage } from "./analyticsPage";
import { drawIncidentsPage } from "./incidentsPage";
import { drawRecommendationPage } from "./recommendationPage";

import { captureDashboardCharts } from "./captureCharts";

/**
 * Generates the complete DDoS Guard report.
 *
 * @param {Object} analytics Dashboard analytics
 * @param {Array} incidents Incident list
 */
export default async function generatePDF(
    analytics,
    incidents = []
) {

    const doc = new jsPDF({

        orientation: "portrait",

        unit: "mm",

        format: "a4"

    });

    //---------------------------------------------------
    // Capture dashboard charts
    //---------------------------------------------------

    const charts = await captureDashboardCharts();

    //---------------------------------------------------
    // Page 1
    //---------------------------------------------------

    await drawCoverPage(doc);

    //---------------------------------------------------
    // Page 2
    //---------------------------------------------------

    drawSummaryPage(
        doc,
        analytics
    );

    //---------------------------------------------------
    // Page 3
    //---------------------------------------------------

    drawAnalyticsPage(
        doc,
        analytics,
        charts
    );

    //---------------------------------------------------
    // Page 4
    //---------------------------------------------------

    drawIncidentsPage(
        doc,
        incidents
    );

    //---------------------------------------------------
    // Page 5
    //---------------------------------------------------

    drawRecommendationPage(doc);

    //---------------------------------------------------
    // Save PDF
    //---------------------------------------------------

    const timestamp = new Date()

        .toISOString()

        .replace(/[:.]/g, "-");

    doc.save(

        `DDoS_Guard_Report_${timestamp}.pdf`

    );

}