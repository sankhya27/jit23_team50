// src/report/captureCharts.js

import html2canvas from "html2canvas";

export async function captureDashboardCharts() {

    const chart = document.querySelector("#live-network-chart");

    if (!chart) {

        return {
            networkChart: null
        };

    }

    const canvas = await html2canvas(chart, {

        scale: 2,

        useCORS: true,

        backgroundColor: "#ffffff",

        logging: false

    });

    return {

        networkChart: canvas.toDataURL("image/png")

    };

}