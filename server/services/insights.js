const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
});

function normalizeNumber(value, fallback = 0) {

    const num = Number(value);

    return Number.isFinite(num)
        ? num
        : fallback;

}

function buildThreatLevel(confidence, isAttack) {

    if (!isAttack)
        return "Low";

    if (confidence >= 0.85)
        return "High";

    if (confidence >= 0.60)
        return "Medium";

    return "Low";

}

function buildSummary(payload) {

    const {

        isAttack = false,

        confidence = 0,

        attackType = "Generic DDoS",

        trafficData = {},

        sourceIP = "Unknown"

    } = payload;

    const packetRate = normalizeNumber(

        trafficData.packet_rate ||

        trafficData.packetRate

    );

    const byteCount = normalizeNumber(

        trafficData.byte_count ||

        trafficData.byteCount

    );

    const duration = normalizeNumber(

        trafficData.duration

    );

    if (!isAttack) {

        return `Traffic appears normal. Packet rate of ${packetRate} over ${duration} seconds did not exceed the detection threshold.`;

    }

    return `Suspicious traffic detected from ${sourceIP}. ${attackType} identified with ${Math.round(confidence * 100)}% confidence. ${packetRate} packets observed over ${duration} seconds with ${byteCount} bytes transferred.`;

}

function buildExplanation(payload) {

    const {

        isAttack = false,

        confidence = 0,

        trafficData = {}

    } = payload;

    const packetRate = normalizeNumber(

        trafficData.packet_rate ||

        trafficData.packetRate

    );

    const byteCount = normalizeNumber(

        trafficData.byte_count ||

        trafficData.byteCount

    );

    const duration = normalizeNumber(

        trafficData.duration

    );

    const protocol =

        trafficData.protocol ||

        "TCP";

    if (!isAttack) {

        return "Traffic characteristics remain within expected operating limits. No mitigation is currently required.";

    }

    return `High traffic volume (${packetRate} packets over ${duration} seconds, ${byteCount} bytes) matched known ${protocol} flood behaviour. The ensemble detection model produced a confidence score of ${Math.round(confidence * 100)}%.`;

}

function buildRecommendations(payload) {

    if (!payload.isAttack) {

        return [

            "Continue monitoring network traffic."

        ];

    }

    return [

        "Enable rate limiting for the suspicious IP.",

        "Block the source IP at the firewall.",

        "Monitor similar traffic patterns.",

        "Review IDS/IPS logs.",

        "Escalate to the SOC team if the attack continues."

    ];

}

async function generateInsight(payload) {

    const fallback = {

        summary: buildSummary(payload),

        explanation: buildExplanation(payload),

        recommendations: buildRecommendations(payload),

        threatLevel: buildThreatLevel(

            payload.confidence || 0,

            payload.isAttack

        ),

        alertLevel: payload.isAttack

            ? "warning"

            : "info",

        llmUsed: false

    };

    if (!process.env.GEMINI_API_KEY) {

        return fallback;

    }

    try {

        const userPrompt = payload.prompt?.trim()

            ?

            payload.prompt

            :

            `

You are DDoS Guard AI.

Explain this cybersecurity incident in simple English.

Incident:

${JSON.stringify(payload,null,2)}

Your response must include:

1. Summary

2. Explanation

3. Mitigation Advice

`;

        const result = await model.generateContent(userPrompt);

        const content = result.response.text();

        if (!content) {

            return fallback;

        }

        return {

            ...fallback,

            summary:

                content.split("\n")[0] ||

                fallback.summary,

            explanation: content,

            recommendations:

                fallback.recommendations,

            llmUsed: true

        };

    }

    catch (err) {

        console.log(

            "[Gemini]",

            err.message

        );

        return fallback;

    }

}

function createReport({

    metrics = {},

    incidents = [],

    user = null

}) {

    const lines = [];

    lines.push("DDoS Guard Security Report");

    lines.push("==========================");

    lines.push("");

    lines.push(

        `Generated for: ${user?.username || "Unknown"}`

    );

    lines.push(

        `Generated at: ${new Date().toLocaleString()}`

    );

    lines.push("");

    lines.push("System Metrics");

    lines.push("----------------");

    lines.push(

        `Packets Analysed : ${metrics.packets_sent || 0}`

    );

    lines.push(

        `Attacks Detected : ${metrics.attacks_detected || 0}`

    );

    lines.push(

        `Packets Blocked : ${metrics.packets_blocked || 0}`

    );

    lines.push(

        `Average Latency : ${metrics.avg_latency_ms || 0} ms`

    );

    lines.push("");

    lines.push("Recent Incidents");

    lines.push("----------------");

    if (!incidents.length) {

        lines.push(

            "No incidents recorded."

        );

    }

    else {

        incidents

            .slice(0,8)

            .forEach((incident,index)=>{

                lines.push(

`${index+1}. ${incident.attackType} | ${incident.severity} | ${incident.sourceIP}`

                );

            });

    }

    return {

        filename:

            `ddos-report-${Date.now()}.txt`,

        content:

            lines.join("\n")

    };

}

module.exports = {

    generateInsight,

    createReport,

    buildSummary,

    buildExplanation,

    buildRecommendations

};