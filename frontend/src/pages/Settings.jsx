import { useEffect, useState } from "react";

import MainLayout from "../components/layout/MainLayout";

import {
    FaUserCog,
    FaLock,
    FaBell,
    FaSave
} from "react-icons/fa";

import "../styles/settings.css";


const API =
    "http://localhost:5001/api";


function authHeader() {

    const token =
        localStorage.getItem("token");

    return {

        Authorization:
            `Bearer ${token}`,

        "Content-Type":
            "application/json"

    };

}


export default function Settings() {

    const [profile, setProfile] =
    useState({
        username: "",
        email: "",
        alertEmail: "",
        role: ""
    });


    const [passwords, setPasswords] =
        useState({

            currentPassword: "",

            newPassword: "",

            confirmPassword: ""

        });


    const [preferences, setPreferences] =
        useState({

            emailAlerts: true

        });


    const [loading, setLoading] =
        useState(true);


    const [savingEmailPreference, setSavingEmailPreference] =
        useState(false);


    const [savingAlertEmail, setSavingAlertEmail] =
        useState(false);




    const [preferenceMessage, setPreferenceMessage] =
        useState({

            text: "",

            ok: true

        });


    const [passwordMsg, setPasswordMsg] =
        useState({

            text: "",

            ok: true

        });


    // =====================================================
    // LOAD SETTINGS
    // =====================================================

    useEffect(() => {

        loadProfile();

    }, []);


    async function loadProfile() {

        try {

            const res =
                await fetch(

                    `${API}/auth/me`,

                    {

                        method:
                            "GET",

                        headers:
                            authHeader()

                    }

                );


            const data =
                await res.json();


            if (!res.ok) {

                throw new Error(

                    data.error ||
                    "Failed to load settings."

                );

            }


            setProfile({
    username: data.username || "",
    email: data.email || "",
    alertEmail: data.alertEmail || "",
    role: data.role || ""
});


            setPreferences({

                emailAlerts:
                    data.emailNotifications ??
                    true

            });

        }

        catch (err) {

            console.error(
                "Settings load error:",
                err
            );

        }

        finally {

            setLoading(false);

        }

    }


    // =====================================================
    // TOGGLE EMAIL NOTIFICATIONS
    // =====================================================

    async function saveAlertEmail() {

        if (savingAlertEmail) {

            return;

        }


        setSavingAlertEmail(true);

        setPreferenceMessage({

            text: "",

            ok: true

        });


        try {

            const res =
                await fetch(

                    `${API}/auth/alert-email`,

                    {

                        method:
                            "PUT",

                        headers:
                            authHeader(),

                        body:
                            JSON.stringify({

                                alertEmail:
                                    profile.alertEmail

                            })

                    }

                );


            const data =
                await res.json();


            if (!res.ok) {

                throw new Error(

                    data.error ||
                    "Failed to update alert email."

                );

            }


            setProfile({

                ...profile,

                alertEmail:
                    data.alertEmail ||
                    profile.alertEmail

            });


            setPreferenceMessage({

                text:
                    "Alert email updated successfully.",

                ok: true

            });

        }

        catch (err) {

            console.error(
                "Alert email error:",
                err
            );


            setPreferenceMessage({

                text:
                    err.message ||
                    "Could not update alert email.",

                ok: false

            });

        }

        finally {

            setSavingAlertEmail(false);

        }

    }

    async function toggleEmailAlerts() {

        if (savingEmailPreference) {

            return;

        }


        const previousValue =
            preferences.emailAlerts;


        const newValue =
            !previousValue;


        // -------------------------------------------------
        // Optimistic UI update
        // -------------------------------------------------

        setPreferences({

            emailAlerts:
                newValue

        });


        setSavingEmailPreference(
            true
        );


        setPreferenceMessage({

            text: "",

            ok: true

        });


        try {

            const res =
                await fetch(

                    `${API}/auth/preferences`,

                    {

                        method:
                            "PUT",

                        headers:
                            authHeader(),

                        body:
                            JSON.stringify({

                                emailAlerts:
                                    newValue

                            })

                    }

                );


            const data =
                await res.json();


            if (!res.ok) {

                throw new Error(

                    data.error ||
                    "Failed to update email notification setting."

                );

            }


            // -------------------------------------------------
            // Use value confirmed by backend
            // -------------------------------------------------

            setPreferences({

                emailAlerts:
                    data.emailAlerts ??
                    newValue

            });


            setPreferenceMessage({

                text:
                    data.emailAlerts

                        ? "Email notifications enabled."

                        : "Email notifications disabled.",

                ok: true

            });

        }

        catch (err) {

            console.error(
                "Email preference error:",
                err
            );


            // -------------------------------------------------
            // Roll UI back if database update failed
            // -------------------------------------------------

            setPreferences({

                emailAlerts:
                    previousValue

            });


            setPreferenceMessage({

                text:
                    "Could not update email notification setting.",

                ok: false

            });

        }

        finally {

            setSavingEmailPreference(
                false
            );

        }

    }


    // =====================================================
    // CHANGE PASSWORD
    // =====================================================

    async function changePassword() {

        setPasswordMsg({

            text: "",

            ok: true

        });


        if (

            passwords.newPassword !==
            passwords.confirmPassword

        ) {

            setPasswordMsg({

                text:
                    "Passwords do not match.",

                ok: false

            });

            return;

        }


        if (
            passwords.newPassword.length < 6
        ) {

            setPasswordMsg({

                text:
                    "Password must be at least 6 characters.",

                ok: false

            });

            return;

        }


        try {

            const res =
                await fetch(

                    `${API}/auth/change-password`,

                    {

                        method:
                            "POST",

                        headers:
                            authHeader(),

                        body:
                            JSON.stringify({

                                currentPassword:
                                    passwords.currentPassword,

                                newPassword:
                                    passwords.newPassword

                            })

                    }

                );


            const data =
                await res.json();


            if (res.ok) {

                setPasswordMsg({

                    text:
                        "Password updated successfully.",

                    ok: true

                });


                setPasswords({

                    currentPassword: "",

                    newPassword: "",

                    confirmPassword: ""

                });

            }

            else {

                setPasswordMsg({

                    text:
                        data.error ||
                        "Failed to update password.",

                    ok: false

                });

            }

        }

        catch (err) {

            console.error(
                "Password change error:",
                err
            );


            setPasswordMsg({

                text:
                    "Network error. Please try again.",

                ok: false

            });

        }

    }


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <MainLayout>

                <div className="settings-page">

                    Loading...

                </div>

            </MainLayout>

        );

    }


    // =====================================================
    // UI
    // =====================================================

    return (

        <MainLayout>

            <div className="settings-page">

                <h1>

                    System Settings

                </h1>


                <div className="settings-grid">


                    {/* =================================================
                        PROFILE
                    ================================================= */}

                    <div className="settings-card">

                        <h2>

                            <FaUserCog />

                            &nbsp;

                            Profile

                        </h2>


                        <div className="setting-item">

                            <label>

                                Username

                            </label>


                            <input

                                type="text"

                                value={
                                    profile.username
                                }

                                readOnly

                            />

                        </div>


                        <div className="setting-item">

                            <label>

                                Email

                            </label>


                            <input

                                type="email"

                                value={
                                    profile.email
                                }

                                readOnly

                            />

                        </div>


                        <div className="setting-item">

                            <label>

                                Role

                            </label>


                            <input

                                type="text"

                                value={
                                    profile.role
                                }

                                readOnly

                            />

                        </div>

                    </div>


                    {/* =================================================
                        PASSWORD
                    ================================================= */}

                    <div className="settings-card">

                        <h2>

                            <FaLock />

                            &nbsp;

                            Change Password

                        </h2>


                        <div className="setting-item">

                            <label>

                                Current Password

                            </label>


                            <input

                                type="password"

                                value={
                                    passwords.currentPassword
                                }

                                onChange={e =>

                                    setPasswords({

                                        ...passwords,

                                        currentPassword:
                                            e.target.value

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

                                value={
                                    passwords.newPassword
                                }

                                onChange={e =>

                                    setPasswords({

                                        ...passwords,

                                        newPassword:
                                            e.target.value

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

                                value={
                                    passwords.confirmPassword
                                }

                                onChange={e =>

                                    setPasswords({

                                        ...passwords,

                                        confirmPassword:
                                            e.target.value

                                    })

                                }

                            />

                        </div>


                        <button

                            className="save-btn"

                            onClick={
                                changePassword
                            }

                        >

                            <FaSave />

                            &nbsp;

                            Update Password

                        </button>


                        {

                            passwordMsg.text &&

                            <p

                                style={{

                                    marginTop:
                                        "12px",

                                    color:
                                        passwordMsg.ok

                                            ? "#22c55e"

                                            : "#ef4444"

                                }}

                            >

                                {
                                    passwordMsg.text
                                }

                            </p>

                        }

                    </div>


                    {/* =================================================
                        NOTIFICATIONS
                    ================================================= */}

                    <div className="settings-card">

                        <h2>

                            <FaBell />

                            &nbsp;

                            Notifications

                        </h2>


                        <div className="setting-item">

                            <label>

                                Alert Email

                            </label>


                            <input

                                type="email"

                                value={
                                    profile.alertEmail
                                }

                                placeholder="security@example.com"

                                onChange={e =>

                                    setProfile({

                                        ...profile,

                                        alertEmail:
                                            e.target.value

                                    })

                                }

                            />


                            <button

                                className="save-btn"

                                onClick={
                                    saveAlertEmail
                                }

                                disabled={
                                    savingAlertEmail
                                }

                            >

                                <FaSave />

                                &nbsp;

                                {savingAlertEmail

                                    ? "Saving..."

                                    : "Save Alert Email"}

                            </button>


                        </div>


                        <div className="toggle-row">

                            <span>

                                Email Notifications

                            </span>


                            <label
                                className="switch"
                            >

                                <input

                                    type="checkbox"

                                    checked={
                                        preferences.emailAlerts
                                    }

                                    disabled={
                                        savingEmailPreference
                                    }

                                    onChange={
                                        toggleEmailAlerts
                                    }

                                />


                                <span
                                    className="slider"
                                ></span>

                            </label>

                        </div>


                        <p

                            style={{

                                marginTop:
                                    "15px",

                                color:
                                    "#9bb0c7",

                                lineHeight:
                                    "1.6"

                            }}

                        >

                            {

                                preferences.emailAlerts

                                    ? "Attack alert emails are enabled. DDoS Guard will send alerts to your registered email address."

                                    : "Attack alert emails are disabled. DDoS Guard will not send attack alert emails."

                            }

                        </p>


                        {

                            preferenceMessage.text &&

                            <p

                                style={{

                                    marginTop:
                                        "12px",

                                    color:
                                        preferenceMessage.ok

                                            ? "#22c55e"

                                            : "#ef4444",

                                    fontSize:
                                        "14px"

                                }}

                            >

                                {
                                    preferenceMessage.text
                                }

                            </p>

                        }

                    </div>


                </div>

            </div>

        </MainLayout>

    );

}