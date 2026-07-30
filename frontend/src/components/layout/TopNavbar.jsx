import { FaCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

import "../../styles/layout.css";

const TopNavbar = () => {

    const { user } = useAuth();

    return (

        <header className="topbar">

            <div>

                <h1>

                    Security Operations Dashboard

                </h1>

                <p>

                    AI-powered DDoS Detection & Monitoring

                </p>

            </div>

            <div className="user-box">

                <FaCircle
                    className="status-dot"
                />

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start"
                    }}
                >

                    <strong>

                        {user?.username || "User"}

                    </strong>

                    <small
                        style={{
                            color: "#9bb0c7",
                            textTransform: "capitalize"
                        }}
                    >

                        {user?.role || "analyst"}

                    </small>

                </div>

            </div>

        </header>

    );

};

export default TopNavbar;