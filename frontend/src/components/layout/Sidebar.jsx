import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
    FaShieldAlt,
    FaChartLine,
    FaChartPie,
    FaHistory,
    FaExclamationTriangle,
    FaFilePdf,
    FaUsers,
    FaCog,
    FaSignOutAlt
} from "react-icons/fa";

import logo from "../../assets/logo.png";

import "../../styles/sidebar.css";

const Sidebar = () => {

    const navigate = useNavigate();

    const location = useLocation();

    const { logout, user } = useAuth();

    function handleLogout() {

        logout();

        navigate("/login");

    }

    return (

        <aside className="sidebar">

            <div>

                {/* =======================================================
                    Logo
                ======================================================= */}

                <div className="logo">

                    <img
                        src={logo}
                        alt="DDoS Guard Logo"
                        className="logo-image"
                    />

                    <div>

                        <h2>DDoS Guard</h2>

                        <p>ML Detection Engine</p>

                    </div>

                </div>

                {/* =======================================================
                    Navigation
                ======================================================= */}

                <nav>

                    <button
                        className={location.pathname === "/" ? "active" : ""}
                        onClick={() => navigate("/")}
                    >
                        <FaChartLine />
                        Dashboard
                    </button>

                    <button
                        className={location.pathname === "/analytics" ? "active" : ""}
                        onClick={() => navigate("/analytics")}
                    >
                        <FaChartPie />
                        Analytics
                    </button>

                    <button
                        className={location.pathname === "/live" ? "active" : ""}
                        onClick={() => navigate("/live")}
                    >
                        <FaShieldAlt />
                        Live Monitoring
                    </button>

                    <button
                        className={location.pathname === "/history" ? "active" : ""}
                        onClick={() => navigate("/history")}
                    >
                        <FaHistory />
                        Detection History
                    </button>

                    <button
                        className={location.pathname === "/incidents" ? "active" : ""}
                        onClick={() => navigate("/incidents")}
                    >
                        <FaExclamationTriangle />
                        Incidents
                    </button>

                    <button
                        className={location.pathname === "/reports" ? "active" : ""}
                        onClick={() => navigate("/reports")}
                    >
                        <FaFilePdf />
                        Reports
                    </button>

                    {user?.role === "admin" && (

                        <>

                            <button
                                className={location.pathname === "/users" ? "active" : ""}
                                onClick={() => navigate("/users")}
                            >
                                <FaUsers />
                                Users
                            </button>

                            <button
                                className={location.pathname === "/settings" ? "active" : ""}
                                onClick={() => navigate("/settings")}
                            >
                                <FaCog />
                                Settings
                            </button>

                        </>

                    )}

                </nav>

            </div>

            {/* =======================================================
                Footer
            ======================================================= */}

            <div className="sidebar-footer">

                <span className={`role-badge ${user?.role}`}>

                    {user?.role?.toUpperCase()}

                </span>

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >

                    <FaSignOutAlt />

                    Logout

                </button>

            </div>

        </aside>

    );

};

export default Sidebar;