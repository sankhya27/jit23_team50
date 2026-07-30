import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

import "../../styles/layout.css";

export default function MainLayout({ children }) {

    return (

        <div className="layout">

            <Sidebar />

            <div className="main-content">

                <TopNavbar />

                <main>

                    {children}

                </main>

            </div>

        </div>

    );

}