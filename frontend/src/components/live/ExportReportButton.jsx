import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportReportButton({

    metrics,

    threat,

    health

}) {

    async function exportPDF() {

        let currentMetrics = metrics;
        let currentHealth = health;

        try {

            const token = localStorage.getItem("token");

            const [metricsResponse, healthResponse] = await Promise.all([

                fetch("http://localhost:5001/api/metrics", {
                    cache: "no-store"
                }),

                fetch("http://localhost:5001/api/system-health", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    cache: "no-store"
                })

            ]);

            if (metricsResponse.ok) {
                currentMetrics = await metricsResponse.json();
            }

            if (healthResponse.ok) {
                currentHealth = await healthResponse.json();
            }

        }

        catch (error) {

            console.error("Live report refresh failed:", error);

        }

        const doc = new jsPDF();

        const currentThreat = currentMetrics.live_attack >= 400
            ? "CRITICAL"
            : currentMetrics.live_attack >= 250
                ? "HIGH"
                : currentMetrics.live_attack >= 100
                    ? "MEDIUM"
                    : "LOW";

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

                ["Packets Analysed",currentMetrics.packets_sent ?? 0],

                ["Attacks Detected",currentMetrics.attacks_detected ?? 0],

                ["Packets Blocked",currentMetrics.packets_blocked ?? 0],

                ["Average Latency",`${currentMetrics.avg_latency_ms ?? 0} ms`],

                ["Detection Accuracy",currentMetrics.effectiveness_pct == null
                    ? "N/A - no labeled predictions"
                    : `${currentMetrics.effectiveness_pct}%`],

                ["Mitigation Rate",currentMetrics.mitigation_effectiveness_pct == null
                    ? "N/A"
                    : `${currentMetrics.mitigation_effectiveness_pct}%`],

                ["Threat Level",currentThreat]

            ]

        });

        autoTable(doc,{

            startY:doc.lastAutoTable.finalY+10,

            head:[["System","Status"]],

            body:[

                ["API",currentHealth.api ?? "Unknown"],

                ["MongoDB",currentHealth.mongodb ?? "Unknown"],

                ["ML Service",currentHealth.ml ?? "Unknown"],

                ["Email",currentHealth.email ?? "Unknown"],

                ["Simulation",currentHealth.simulation ?? "Unknown"]

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