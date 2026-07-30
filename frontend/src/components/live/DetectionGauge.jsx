export default function DetectionGauge({ value }) {

    const radius = 70;

    const circumference = 2 * Math.PI * radius;

    const progress = circumference - (value / 100) * circumference;

    return (

        <div className="chart-card gauge-card">

            <h3>

                Detection Effectiveness

            </h3>

            <svg
                width="180"
                height="180"
            >

                <circle

                    cx="90"

                    cy="90"

                    r={radius}

                    stroke="#24354f"

                    strokeWidth="12"

                    fill="none"

                />

                <circle

                    cx="90"

                    cy="90"

                    r={radius}

                    stroke="#22c55e"

                    strokeWidth="12"

                    fill="none"

                    strokeLinecap="round"

                    strokeDasharray={circumference}

                    strokeDashoffset={progress}

                    transform="rotate(-90 90 90)"

                />

                <text

                    x="90"

                    y="95"

                    textAnchor="middle"

                    className="gauge-text"

                >

                    {value}%

                </text>

            </svg>

        </div>

    );

}