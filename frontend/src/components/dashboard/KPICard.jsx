import { motion } from "framer-motion";
import "../../styles/dashboard.css";

const KPICard = ({
    title,
    value,
    icon,
    color,
    subtitle
}) => {

    return (

        <motion.div

            className="kpi-card"

            whileHover={{

                y: -8,

                scale: 1.03

            }}

            transition={{

                duration: 0.25

            }}

        >

            <div

                className="kpi-top-border"

                style={{

                    background: color

                }}

            />

            <div className="kpi-header">

                <div className="kpi-title-section">

                    <h4>

                        {title}

                    </h4>

                    <small>

                        {subtitle}

                    </small>

                </div>

                <div

                    className="icon-circle"

                    style={{

                        background: color,

                        boxShadow: `0 0 25px ${color}66`

                    }}

                >

                    {icon}

                </div>

            </div>

            <div className="kpi-body">

                <h2>

                    {value}

                </h2>

            </div>

            <div className="kpi-footer">

                <div className="live-indicator">

                    <span className="live-dot"></span>

                    <span>

                        LIVE

                    </span>

                </div>

                <span className="kpi-status">

                    Real-Time

                </span>

            </div>

        </motion.div>

    );

};

export default KPICard;