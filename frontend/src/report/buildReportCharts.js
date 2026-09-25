function createCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function drawTitle(ctx, title, width) {
    ctx.fillStyle = "#071a2d";
    ctx.font = "bold 16px Inter, Arial, sans-serif";
    ctx.fillText(title, 18, 24);
    ctx.strokeStyle = "#00b8ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 30);
    ctx.lineTo(Math.min(width - 18, 180), 30);
    ctx.stroke();
}

function drawEmptyState(ctx, width, height, message) {
    ctx.fillStyle = "#64748b";
    ctx.font = "13px Inter, Arial, sans-serif";
    ctx.fillText(message, 18, height / 2);
}

function canvasToImage(canvas) {
    return canvas.toDataURL("image/png");
}

function drawBarChart(labels, values, title) {
    const width = 720;
    const height = 260;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    drawTitle(ctx, title, width);

    if (!labels.length || !values.some(v => v > 0)) {
        drawEmptyState(ctx, width, height, "No attack type data available yet.");
        return canvasToImage(canvas);
    }

    const chartLeft = 50;
    const chartTop = 48;
    const chartWidth = width - 80;
    const chartHeight = height - 78;
    const max = Math.max(...values, 1);
    const barWidth = Math.min(48, chartWidth / labels.length - 12);

    labels.forEach((label, index) => {
        const value = values[index] || 0;
        const barHeight = (value / max) * chartHeight;
        const x = chartLeft + index * (barWidth + 16);
        const y = chartTop + chartHeight - barHeight;

        ctx.fillStyle = "#2ea8ff";
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "#475569";
        ctx.font = "11px Inter, Arial, sans-serif";
        ctx.fillText(String(label).slice(0, 10), x, chartTop + chartHeight + 16);

        ctx.fillStyle = "#0f172a";
        ctx.fillText(String(value), x, y - 6);
    });

    return canvasToImage(canvas);
}

function drawLineChart(labels, values, title, color = "#ff5b5b") {
    const width = 720;
    const height = 260;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    drawTitle(ctx, title, width);

    if (!values.length || !values.some(v => v > 0)) {
        drawEmptyState(ctx, width, height, "No trend data available yet.");
        return canvasToImage(canvas);
    }

    const chartLeft = 42;
    const chartTop = 48;
    const chartWidth = width - 70;
    const chartHeight = height - 82;
    const max = Math.max(...values, 1);
    const step = labels.length > 1 ? chartWidth / (labels.length - 1) : chartWidth;

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = chartTop + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(chartLeft, y);
        ctx.lineTo(chartLeft + chartWidth, y);
        ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();

    values.forEach((value, index) => {
        const x = chartLeft + step * index;
        const y = chartTop + chartHeight - ((value / max) * chartHeight);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();

    ctx.fillStyle = color;
    values.forEach((value, index) => {
        const x = chartLeft + step * index;
        const y = chartTop + chartHeight - ((value / max) * chartHeight);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter, Arial, sans-serif";
    labels.forEach((label, index) => {
        if (index % Math.ceil(labels.length / 8) !== 0 && index !== labels.length - 1) {
            return;
        }
        const x = chartLeft + step * index;
        ctx.fillText(String(label), x - 8, chartTop + chartHeight + 18);
    });

    return canvasToImage(canvas);
}

export default function buildReportCharts(analytics = {}) {
    const attackEntries = Object.entries(analytics.attackTypes || {});
    const hourly = analytics.hourly || [];
    const weekly = analytics.weekly || [];

    return {
        attackTypesChart: drawBarChart(
            attackEntries.map(([name]) => name),
            attackEntries.map(([, value]) => Number(value) || 0),
            "Attack Types"
        ),
        hourlyChart: drawLineChart(
            hourly.map((_, index) => `${index}:00`),
            hourly.map(value => Number(value) || 0),
            "Hourly Attack Trend",
            "#ff5b5b"
        ),
        weeklyChart: drawLineChart(
            weekly.map(item => item.day),
            weekly.map(item => Number(item.attacks) || 0),
            "Weekly Attack Trend",
            "#22c55e"
        )
    };
}
