import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import LiveMonitoring from "./pages/LiveMonitoring";
import DetectionHistory from "./pages/DetectionHistory";
import Incidents from "./pages/Incidents";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {

    return (

        <Routes>

            <Route path="/login" element={<Login />} />

            <Route path="/signup" element={<Signup />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/live"
                element={
                    <ProtectedRoute>
                        <LiveMonitoring />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/history"
                element={
                    <ProtectedRoute>
                        <DetectionHistory />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/incidents"
                element={
                    <ProtectedRoute>
                        <Incidents />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/analytics"
                element={
                    <ProtectedRoute>
                        <Analytics />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/reports"
                element={
                    <ProtectedRoute>
                        <Reports />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/users"
                element={
                    <ProtectedRoute role="admin">
                        <Users />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <ProtectedRoute role="admin">
                        <Settings />
                    </ProtectedRoute>
                }
            />

            <Route
                path="*"
                element={<Navigate to="/" />}
            />

        </Routes>

    );

}