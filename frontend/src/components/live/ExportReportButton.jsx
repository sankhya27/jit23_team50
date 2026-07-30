import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportReportButton({

    metrics,

    threat,

    health

}) {

    function exportPDF() {

        const doc = new jsPDF();

        doc.setFontSize(20);

        doc.text("DDoS Guard Security Report", 14, 18);

        doc.setFontSize(11);

        doc.text(

            `Generated : ${new Date().toLocaleString()}`,

            14,

            28

        );

        autoTable(doc,{

            startY:40,

            head:[["Metric","Value"]],

            body:[

                ["Packets Analysed",metrics.packets_sent],

                ["Attacks Detected",metrics.attacks_detected],

                ["Packets Blocked",metrics.packets_blocked],

                ["Average Latency",`${metrics.avg_latency_ms} ms`],

                ["Detection Effectiveness",`${metrics.effectiveness_pct}%`],

                ["Threat Level",threat]

            ]

        });

        autoTable(doc,{

            startY:doc.lastAutoTable.finalY+10,

            head:[["System","Status"]],

            body:[

                ["API",health.api],

                ["MongoDB",health.mongodb],

                ["ML Service",health.ml],

                ["Email",health.email],

                ["Simulation",health.simulation]

            ]

        });

        doc.save(

            `DDoS_Guard_Report_${Date.now()}.pdf`

        );

    }

    return(

        <button

            className="export-btn"

            onClick={exportPDF}

        >

            📄 Export Security Report

        </button>

    );

}