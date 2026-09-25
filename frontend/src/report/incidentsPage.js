// src/report/incidentsPage.js

import autoTable from "jspdf-autotable";

import {
    drawFooter,
    drawHeader,
    drawPageBackground,
    drawSectionTitle,
    drawWatermark
} from "./pdfHelpers";

export function drawIncidentsPage(doc, incidents = []) {

    doc.addPage();

    drawPageBackground(doc);

    drawHeader(doc);

    drawWatermark(doc);

    drawSectionTitle(
        doc,
        "Incident Log",
        36
    );

    doc.setFont("helvetica", "normal");

    doc.setFontSize(11);

    doc.setTextColor(100);

    doc.text(
        "Recent incidents detected by the Machine Learning DDoS detection engine.",
        20,
        47
    );

    //------------------------------------------------------------

    if (!incidents.length) {

        doc.setFontSize(13);

        doc.setTextColor(120);

        doc.text(
            "No incidents available.",
            20,
            65
        );

        drawFooter(doc,4);

        return;

    }

    //------------------------------------------------------------

    const rows = incidents.map((incident) => {
        const confidence = incident.detection?.confidence ?? incident.confidence ?? 0;
        const confidencePct = confidence <= 1
            ? Math.round(confidence * 100)
            : Math.round(confidence);

        return [
            incident.createdAt
                ? new Date(incident.createdAt).toLocaleString()
                : "N/A",
            incident.attackType || "Unknown",
            String(incident.severity || "unknown").toUpperCase(),
            `${confidencePct}%`,
            incident.sourceIP || incident.source_ip || "unknown"
        ];
    });

    //------------------------------------------------------------

    autoTable(doc, {

        startY: 58,

        head: [[

            "Time",

            "Attack",

            "Severity",

            "Confidence",

            "Source IP"

        ]],

        body: rows,

        theme: "grid",

        styles: {

            fontSize: 9,

            cellPadding: 4,

            lineColor: [225,225,225],

            lineWidth: 0.2

        },

        headStyles: {

            fillColor: [7,26,45],

            textColor: 255,

            fontStyle: "bold",

            halign: "center"

        },

        alternateRowStyles: {

            fillColor: [247,250,252]

        },

        bodyStyles: {

            textColor: 60

        },

        didParseCell(data) {

            if (

                data.section === "body" &&

                data.column.index === 2

            ) {

                const severity = data.cell.raw;

                switch (severity) {

                    case "CRITICAL":

                        data.cell.styles.fillColor = [220,53,69];

                        data.cell.styles.textColor = 255;

                        break;

                    case "HIGH":

                        data.cell.styles.fillColor = [255,159,67];

                        data.cell.styles.textColor = 255;

                        break;

                    case "MEDIUM":

                        data.cell.styles.fillColor = [255,214,10];

                        data.cell.styles.textColor = 50;

                        break;

                    case "LOW":

                        data.cell.styles.fillColor = [46,204,113];

                        data.cell.styles.textColor = 255;

                        break;

                }

            }

        }

    });

    //------------------------------------------------------------

    doc.setFont(

        "helvetica",

        "italic"

    );

    doc.setFontSize(10);

    doc.setTextColor(120);

    doc.text(

        `Total Logged Incidents : ${incidents.length}`,

        20,

        275

    );

    drawFooter(doc,4);

}