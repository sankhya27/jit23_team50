// src/report/pdfHelpers.js

export function drawPageBackground(doc) {

    // White background
    doc.setFillColor(250, 252, 255);
    doc.rect(0, 0, 210, 297, "F");

    // Top Header
    doc.setFillColor(7, 26, 45);
    doc.rect(0, 0, 210, 22, "F");

    // Blue Accent
    doc.setFillColor(0, 184, 255);
    doc.rect(0, 22, 210, 3, "F");

}

export function drawSectionTitle(doc, title, y) {

    doc.setFont("helvetica", "bold");

    doc.setFontSize(21);

    doc.setTextColor(7, 26, 45);

    doc.text(title, 20, y);

    doc.setDrawColor(0, 184, 255);

    doc.setLineWidth(0.8);

    doc.line(20, y + 3, 95, y + 3);

}

export function drawHeader(doc) {

    doc.setFont("helvetica", "bold");

    doc.setFontSize(15);

    doc.setTextColor(255,255,255);

    doc.text(
        "DDoS Guard",
        20,
        14
    );

    doc.setFontSize(9);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.text(
        "Machine Learning Powered Security Platform",
        20,
        19
    );

}

export function drawWatermark(doc) {

    doc.saveGraphicsState();

    doc.setTextColor(235);

    doc.setFontSize(42);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(

        "DDoS GUARD",

        105,

        160,

        {

            align: "center",

            angle: 45

        }

    );

    doc.restoreGraphicsState();

}

export function drawMetricCard(
    doc,
    x,
    y,
    w,
    h,
    title,
    value,
    color
) {

    doc.setFillColor(255,255,255);

    doc.roundedRect(
        x,
        y,
        w,
        h,
        5,
        5,
        "F"
    );

    doc.setDrawColor(225);

    doc.roundedRect(
        x,
        y,
        w,
        h,
        5,
        5
    );

    // Colored top border

    doc.setFillColor(
        color[0],
        color[1],
        color[2]
    );

    doc.rect(
        x,
        y,
        w,
        4,
        "F"
    );

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(11);

    doc.setTextColor(90);

    doc.text(
        title,
        x + 6,
        y + 15
    );

    doc.setFontSize(24);

    doc.setTextColor(
        color[0],
        color[1],
        color[2]
    );

    doc.text(
        String(value),
        x + 6,
        y + 31
    );

}

export function drawInfoBox(
    doc,
    x,
    y,
    w,
    h,
    title,
    body
) {

    doc.setFillColor(255,255,255);

    doc.roundedRect(
        x,
        y,
        w,
        h,
        4,
        4,
        "F"
    );

    doc.setDrawColor(225);

    doc.roundedRect(
        x,
        y,
        w,
        h,
        4,
        4
    );

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(13);

    doc.setTextColor(7,26,45);

    doc.text(
        title,
        x + 6,
        y + 10
    );

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(10);

    doc.setTextColor(85);

    doc.text(
        body,
        x + 6,
        y + 20,
        {
            maxWidth: w - 12
        }
    );

}

export function drawFooter(doc, pageNumber) {

    // Footer line

    doc.setDrawColor(220);

    doc.line(
        15,
        285,
        195,
        285
    );

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(9);

    doc.setTextColor(110);

    doc.text(

        "DDoS Guard • Machine Learning Powered DDoS Detection & Prevention Platform",

        15,

        291

    );

    doc.text(

        `Page ${pageNumber}`,

        180,

        291

    );

}
export function formatDateTime(date = new Date()) {

    const formattedDate = date.toLocaleDateString("en-GB", {

        day: "2-digit",

        month: "long",

        year: "numeric"

    });

    const formattedTime = date.toLocaleTimeString("en-US", {

        hour: "2-digit",

        minute: "2-digit",

        second: "2-digit"

    });

    return {

        date: formattedDate,

        time: formattedTime

    };

}