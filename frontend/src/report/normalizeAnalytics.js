function normalizeSeverity(severity = {}) {
    const out = { critical: 0, high: 0, medium: 0, low: 0 };

    Object.entries(severity).forEach(([key, value]) => {
        const normalized = String(key || "").trim().toLowerCase();
        if (Object.prototype.hasOwnProperty.call(out, normalized)) {
            out[normalized] = Number(value) || 0;
        }
    });

    return out;
}

export default function normalizeAnalytics(analytics = {}) {
    const live = analytics.live || {};

    const mitigation =
        analytics.mitigationEffectiveness ??
        live.mitigationEffectiveness ??
        null;

    const liveEffectiveness =
        live.effectiveness ??
        live.effectiveness_pct ??
        null;

    const averageConfidence = Number(analytics.averageConfidence) || 0;

    const averageEffectiveness =
        mitigation ??
        liveEffectiveness ??
        (averageConfidence > 0 ? averageConfidence : null);

    return {
        ...analytics,
        totalIncidents: Number(analytics.totalIncidents) || 0,
        totalDetections: Number(analytics.totalDetections) || 0,
        resolved: Number(analytics.resolved) || 0,
        unresolved: Number(analytics.unresolved) || 0,
        averageLatency:
            Number(analytics.averageLatency) ||
            Number(live.latency) ||
            Number(live.avg_latency_ms) ||
            0,
        averageConfidence,
        averageEffectiveness:
            averageEffectiveness == null
                ? null
                : Number(Number(averageEffectiveness).toFixed(1)),
        mitigationEffectiveness:
            mitigation == null
                ? null
                : Number(Number(mitigation).toFixed(1)),
        mostCommonAttack: analytics.mostCommonAttack || "None",
        attackTypes: analytics.attackTypes || {},
        severity: normalizeSeverity(analytics.severity),
        hourly: Array.isArray(analytics.hourly)
            ? analytics.hourly
            : new Array(24).fill(0),
        weekly: Array.isArray(analytics.weekly)
            ? analytics.weekly
            : [],
        topAttackers: analytics.topAttackers || [],
        live,
        generatedAt: new Date().toISOString()
    };
}

export function formatPercent(value) {
    if (value == null || Number.isNaN(Number(value))) {
        return "N/A";
    }
    return `${Number(value).toFixed(1)}%`;
}
