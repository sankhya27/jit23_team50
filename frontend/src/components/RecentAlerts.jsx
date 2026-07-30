import {
    FaBug,
    FaCheckCircle,
    FaExclamationTriangle,
    FaGlobe,
    FaClock
} from "react-icons/fa";

export default function RecentAlerts({
    alerts = []
}) {

    function timeAgo(date) {

        if (!date) return "Just now";

        const seconds = Math.floor(

            (Date.now() -
                new Date(date).getTime()) / 1000

        );

        if (seconds < 60)
            return "Just now";

        if (seconds < 3600)
            return `${Math.floor(seconds / 60)} min ago`;

        if (seconds < 86400)
            return `${Math.floor(seconds / 3600)} hr ago`;

        return `${Math.floor(seconds / 86400)} day ago`;

    }

    return (

        <div className="chart-card">

            <div className="alerts-header">

                <h3>
                    Recent Alerts
                </h3>

                <span className="live-badge">
                    LIVE
                </span>

            </div>

            {

                alerts.length === 0

                    ?

                    <div className="no-alerts">

                        <FaCheckCircle />

                        <p>
                            No active threats detected.
                        </p>

                    </div>

                    :

                    alerts.map((alert, index) => (

                        <div

                            key={
                                alert._id ||
                                alert.id ||
                                `${alert.sourceIP}-${alert.createdAt}-${index}`
                            }

                            className="alert-item"

                        >

                            <div

                                className={
                                    `alert-icon ${
                                        alert.severity || "high"
                                    }`
                                }

                            >

                                <FaBug />

                            </div>

                            <div className="alert-content">

                                <div className="alert-top">

                                    <strong>

                                        {
                                            alert.attackType ||
                                            alert.attack_type ||
                                            "Unknown Attack"
                                        }

                                    </strong>

                                    <span

                                        className={
                                            `severity-pill ${
                                                alert.severity || "high"
                                            }`
                                        }

                                    >

                                        {

                                            (
                                                alert.severity ||
                                                "high"
                                            ).toUpperCase()

                                        }

                                    </span>

                                </div>

                                <div className="alert-middle">

                                    <FaGlobe />

                                    {

                                        alert.sourceIP ||
                                        alert.source_ip ||
                                        "Unknown IP"

                                    }

                                </div>

                                <div className="alert-bottom">

                                    <span>

                                        <FaExclamationTriangle />

                                        {

                                            Math.round(

                                                (
                                                    alert.detection
                                                        ?.confidence ||

                                                    alert.confidence ||

                                                    0

                                                ) * 100

                                            )

                                        }% Confidence

                                    </span>

                                    <span>

                                        <FaClock />

                                        {

                                            timeAgo(

                                                alert.createdAt ||
                                                alert.created_at ||
                                                new Date()

                                            )

                                        }

                                    </span>

                                </div>

                            </div>

                        </div>

                    ))

            }

        </div>

    );

}