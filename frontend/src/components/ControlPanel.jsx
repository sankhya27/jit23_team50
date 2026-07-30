import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    FaPlay,
    FaStop,
    FaNetworkWired,
    FaLock
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5001/api";

const REQUEST_TIMEOUT = 5000;

export default function ControlPanel() {

    const { user } = useAuth();

    const isAdmin =
        user?.role === "admin";

    const [running, setRunning] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState(false);

    // =====================================================
    // FETCH WITH TIMEOUT
    // =====================================================

    async function fetchWithTimeout(
        url,
        options = {},
        timeout = REQUEST_TIMEOUT
    ) {

        const controller =
            new AbortController();

        const timeoutId =
            setTimeout(() => {

                controller.abort();

            }, timeout);

        try {

            const response =
                await fetch(

                    url,

                    {
                        ...options,

                        signal:
                            controller.signal
                    }

                );

            return response;

        }

        finally {

            clearTimeout(timeoutId);

        }

    }

    // =====================================================
    // LOAD CURRENT SIMULATOR STATE
    // =====================================================

    async function loadState() {

        try {

            const res =
                await fetchWithTimeout(

                    `${API}/system-health`,

                    {
                        cache: "no-store"
                    }

                );

            if (!res.ok) {

                console.log(
                    "System health request failed:",
                    res.status
                );

                return;

            }

            const data =
                await res.json();

            setRunning(

                Boolean(
                    data.simulation_running
                )

            );

        }

        catch (err) {

            if (
                err.name ===
                "AbortError"
            ) {

                console.log(
                    "System health request timed out."
                );

            }

            else {

                console.log(
                    "Unable to load simulator state:",
                    err
                );

            }

        }

    }

    // =====================================================
    // INITIAL STATE + SSE
    // =====================================================

    useEffect(() => {

        loadState();

        const source =
            new EventSource(

                `${API}/simulate/stream`

            );

        source.onopen = () => {

            console.log(
                "ControlPanel SSE connected"
            );

        };

        source.onmessage =
            (event) => {

                try {

                    const data =
                        JSON.parse(
                            event.data
                        );

                    // =====================================
                    // CONNECTED
                    // =====================================

                    if (
                        data.connected
                    ) {

                        setRunning(

                            Boolean(
                                data.running
                            )

                        );

                    }

                    // =====================================
                    // STARTED
                    // =====================================

                    if (
                        data.type ===
                        "start"
                    ) {

                        setRunning(true);

                    }

                    // =====================================
                    // STOPPED
                    // =====================================

                    if (
                        data.type ===
                        "stop"
                    ) {

                        setRunning(false);

                    }

                }

                catch (err) {

                    console.log(
                        "Invalid simulator SSE data:",
                        err
                    );

                }

            };

        source.onerror = () => {

            console.log(
                "ControlPanel SSE disconnected"
            );

        };

        return () => {

            source.close();

        };

    }, []);

    // =====================================================
    // START SIMULATION
    // =====================================================

    async function startSimulation() {

        if (
            !isAdmin ||
            actionLoading ||
            running
        ) {

            return;

        }

        setActionLoading(true);

        try {

            const token =
                localStorage.getItem(
                    "token"
                );

            const res =
                await fetchWithTimeout(

                    `${API}/simulate/start`,

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`

                        },

                        body: JSON.stringify({

                            attack_type:
                                "random"

                        })

                    }

                );

            let data = {};

            try {

                data =
                    await res.json();

            }

            catch {

                data = {};

            }

            if (!res.ok) {

                throw new Error(

                    data.error ||
                    `Failed to start simulation (${res.status})`

                );

            }

            // Update UI immediately.
            setRunning(true);

            toast.success(
                "Simulation started"
            );

        }

        catch (err) {

            console.log(
                "Start simulation error:",
                err
            );

            if (
                err.name ===
                "AbortError"
            ) {

                toast.error(
                    "Start request timed out. Please check the backend."
                );

            }

            else {

                toast.error(

                    err.message ||
                    "Unable to start simulation."

                );

            }

            // Verify actual backend state.
            await loadState();

        }

        finally {

            setActionLoading(false);

        }

    }

    // =====================================================
    // STOP SIMULATION
    // =====================================================

    async function stopSimulation() {

        if (
            !isAdmin ||
            actionLoading ||
            !running
        ) {

            return;

        }

        setActionLoading(true);

        try {

            const token =
                localStorage.getItem(
                    "token"
                );

            const res =
                await fetchWithTimeout(

                    `${API}/simulate/stop`,

                    {

                        method: "POST",

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }

                    }

                );

            let data = {};

            try {

                data =
                    await res.json();

            }

            catch {

                data = {};

            }

            if (!res.ok) {

                throw new Error(

                    data.error ||
                    `Failed to stop simulation (${res.status})`

                );

            }

            // Immediately update UI.
            setRunning(false);

            toast.success(
                "Simulation stopped"
            );

        }

        catch (err) {

            console.log(
                "Stop simulation error:",
                err
            );

            if (
                err.name ===
                "AbortError"
            ) {

                toast.error(
                    "Stop request timed out. Please check the backend."
                );

            }

            else {

                toast.error(

                    err.message ||
                    "Unable to stop simulation."

                );

            }

            // Check the actual backend state.
            await loadState();

        }

        finally {

            // IMPORTANT:
            // Never leave the button stuck
            // on "Stopping..." or "Starting..."
            setActionLoading(false);

        }

    }

    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="control-panel">

            <h3>

                <FaNetworkWired />

                &nbsp;

                Live Traffic Simulator

            </h3>

            {/* START */}

            <button

                className="sim-btn syn"

                disabled={

                    !isAdmin ||
                    running ||
                    actionLoading

                }

                onClick={
                    startSimulation
                }

            >

                <FaPlay />

                {

                    actionLoading &&
                    !running

                        ? " Starting..."

                        : " Start Live Traffic"

                }

            </button>

            {/* STOP */}

            <button

                className="sim-btn stop"

                disabled={

                    !isAdmin ||
                    !running ||
                    actionLoading

                }

                onClick={
                    stopSimulation
                }

            >

                <FaStop />

                {

                    actionLoading &&
                    running

                        ? " Stopping..."

                        : " Stop Simulation"

                }

            </button>

            {/* STATUS */}

            <div className="status-box">

                Status :

                <strong>

                    {

                        running

                            ? " Running"

                            : " Stopped"

                    }

                </strong>

            </div>

            {/* NON-ADMIN MESSAGE */}

            {

                !isAdmin && (

                    <div

                        style={{

                            marginTop: "18px",

                            padding: "12px",

                            borderRadius: "10px",

                            background:
                                "rgba(255,193,7,.12)",

                            color:
                                "#ffd54f",

                            display: "flex",

                            alignItems:
                                "center",

                            gap: "10px",

                            fontSize:
                                "14px"

                        }}

                    >

                        <FaLock />

                        Only administrators can
                        control traffic simulations.

                    </div>

                )

            }

            <p

                style={{

                    marginTop: "16px",

                    opacity: 0.75,

                    lineHeight: "1.6",

                    fontSize: "13px"

                }}

            >

                The simulator generates realistic
                normal and attack traffic.

                Analysts can monitor the simulation
                in real time, while only administrators
                can start or stop it.

            </p>

        </div>

    );

}