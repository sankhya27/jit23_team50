import { useEffect, useState } from "react";

import MainLayout from "../components/layout/MainLayout";

import {

    FaUserCog,
    FaLock,
    FaBell,
    FaMoon,
    FaSun,
    FaRobot,
    FaSave

} from "react-icons/fa";

import "../styles/settings.css";

const API = "http://localhost:5001/api";

function authHeader() {

    const token = localStorage.getItem("token");

    return {

        Authorization: `Bearer ${token}`

    };

}

export default function Settings() {

    const [profile, setProfile] = useState({

        username: "",

        email: "",

        role: ""

    });

    const [passwords, setPasswords] = useState({

        currentPassword: "",

        newPassword: "",

        confirmPassword: ""

    });

    const [preferences, setPreferences] = useState({

        emailAlerts: true,

        desktopAlerts: true,

        aiAssistant: true,

        darkMode: true

    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadProfile();

    }, []);

    async function loadProfile() {

        try {

            const res = await fetch(

                `${API}/auth/me`,

                {

                    headers: authHeader()

                }

            );

            const data = await res.json();

            setProfile({

                username: data.username,

                email: data.email,

                role: data.role

            });

        }

        catch(err){

            console.log(err);

        }

        finally{

            setLoading(false);

        }

    }

    function updatePreference(key){

        setPreferences(prev=>({

            ...prev,

            [key]:!prev[key]

        }));

    }

    function savePreferences(){

        alert("Settings saved successfully.");

    }

    const [passwordMsg, setPasswordMsg] = useState({ text: "", ok: true });

    async function changePassword() {

        if (passwords.newPassword !== passwords.confirmPassword) {
            setPasswordMsg({ text: "Passwords do not match.", ok: false });
            return;
        }

        if (passwords.newPassword.length < 6) {
            setPasswordMsg({ text: "Password must be at least 6 characters.", ok: false });
            return;
        }

        try {

            const res = await fetch(`${API}/auth/change-password`, {
                method: "POST",
                headers: {
                    ...authHeader(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setPasswordMsg({ text: "Password updated successfully.", ok: true });
                setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                setPasswordMsg({ text: data.error || "Failed to update password.", ok: false });
            }

        } catch (err) {
            setPasswordMsg({ text: "Network error. Please try again.", ok: false });
        }

    }

    if(loading){

        return(

            <MainLayout>

                <div className="settings-page">

                    Loading...

                </div>

            </MainLayout>

        );

    }

    return (

        <MainLayout>

            <div className="settings-page">

            <h1>

                System Settings

            </h1>

            <div className="settings-grid">

                {/* ===========================
                    PROFILE
                ============================ */}

                <div className="settings-card">

                    <h2>

                        <FaUserCog />

                        &nbsp; Profile

                    </h2>

                    <div className="setting-item">

                        <label>

                            Username

                        </label>

                        <input

                            type="text"

                            value={profile.username}

                            readOnly

                        />

                    </div>

                    <div className="setting-item">

                        <label>

                            Email

                        </label>

                        <input

                            type="text"

                            value={profile.email}

                            readOnly

                        />

                    </div>

                    <div className="setting-item">

                        <label>

                            Role

                        </label>

                        <input

                            type="text"

                            value={profile.role}

                            readOnly

                        />

                    </div>

                </div>

                {/* ===========================
                    PASSWORD
                ============================ */}

                <div className="settings-card">

                    <h2>

                        <FaLock />

                        &nbsp; Change Password

                    </h2>

                    <div className="setting-item">

                        <label>

                            Current Password

                        </label>

                        <input

                            type="password"

                            value={passwords.currentPassword}

                            onChange={(e)=>

                                setPasswords({

                                    ...passwords,

                                    currentPassword:e.target.value

                                })

                            }

                        />

                    </div>

                    <div className="setting-item">

                        <label>

                            New Password

                        </label>

                        <input

                            type="password"

                            value={passwords.newPassword}

                            onChange={(e)=>

                                setPasswords({

                                    ...passwords,

                                    newPassword:e.target.value

                                })

                            }

                        />

                    </div>

                    <div className="setting-item">

                        <label>

                            Confirm Password

                        </label>

                        <input

                            type="password"

                            value={passwords.confirmPassword}

                            onChange={(e)=>

                                setPasswords({

                                    ...passwords,

                                    confirmPassword:e.target.value

                                })

                            }

                        />

                    </div>

                    <button

                        className="save-btn"

                        onClick={changePassword}

                    >

                        <FaSave />

                        &nbsp;

                        Update Password

                    </button>

                    {passwordMsg.text && (
                        <p style={{
                            marginTop: "10px",
                            color: passwordMsg.ok ? "#22c55e" : "#ef4444",
                            fontSize: "14px"
                        }}>
                            {passwordMsg.text}
                        </p>
                    )}
                    
                </div>
                                    {/* ===========================
                    NOTIFICATIONS
                ============================ */}

                <div className="settings-card">

                    <h2>
                        <FaBell />

                        &nbsp; Notifications

                    </h2>

                    <div className="toggle-row">

                        <span>

                            Email Alerts

                        </span>

                        <label className="switch">

                            <input

                                type="checkbox"

                                checked={preferences.emailAlerts}

                                onChange={()=>

                                    updatePreference("emailAlerts")

                                }

                            />

                            <span className="slider"></span>

                        </label>

                    </div>

                    <div className="toggle-row">

                        <span>

                            Desktop Notifications

                        </span>

                        <label className="switch">

                            <input

                                type="checkbox"

                                checked={preferences.desktopAlerts}

                                onChange={()=>

                                    updatePreference("desktopAlerts")

                                }

                            />

                            <span className="slider"></span>

                        </label>

                    </div>

                </div>

                {/* ===========================
                    APPEARANCE
                ============================ */}

                <div className="settings-card">

                    <h2>

                        {

                            preferences.darkMode ?

                            <FaMoon />

                            :

                            <FaSun />

                        }

                        &nbsp; Appearance

                    </h2>

                    <div className="toggle-row">

                        <span>

                            Dark Mode

                        </span>

                        <label className="switch">

                            <input

                                type="checkbox"

                                checked={preferences.darkMode}

                                onChange={()=>

                                    updatePreference("darkMode")

                                }

                            />

                            <span className="slider"></span>

                        </label>

                    </div>

                    </div>

                    {/* ===========================
                        AI ASSISTANT
                    ============================ */}

                    <div className="settings-card">

                        <h2>🤖 AI Assistant</h2>

                        <div className="toggle-row">

                            <span>Enable AI Assistant</span>

                            <label className="switch">

                                <input

                                    type="checkbox"

                                    checked={preferences.aiAssistant}

                                    onChange={() =>

                                        updatePreference("aiAssistant")

                                    }

                                />

                                <span className="slider"></span>

                            </label>

                        </div>

                        <p
                            style={{
                                marginTop: "12px",
                                color: "#9bb0c7",
                                fontSize: "14px",
                                lineHeight: "1.6"
                            }}
                        >

                            Enable the integrated AI security assistant for
                            attack explanations, mitigation suggestions and
                            incident analysis.

                        </p>

                    </div>

                </div>

            </div>

        </MainLayout>

    );

}