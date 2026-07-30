import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "../styles/auth.css";

const API = "http://localhost:5001/api";

export default function Login() {

    const navigate = useNavigate();
    const { login } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");

    async function handleLogin(e) {

        e.preventDefault();

        setError("");

        try {

            const res = await fetch(`${API}/auth/login`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username,
                    password
                })

            });

            const data = await res.json();

            if (!res.ok) {

                setError(data.error || "Login failed");

                return;

            }

            login(data.token, data.user);

            navigate("/");

        }

        catch {

            setError("Server unavailable");

        }

    }

    return (

        <div className="auth-page">

            <form
                className="auth-card"
                onSubmit={handleLogin}
            >

                <h1>🛡 DDoS Guard</h1>

                <p>Security Monitoring Platform</p>

                <input

                    placeholder="Username"

                    value={username}

                    onChange={e => setUsername(e.target.value)}

                />

                <input

                    type="password"

                    placeholder="Password"

                    value={password}

                    onChange={e => setPassword(e.target.value)}

                />

                {

                    error &&

                    <div className="auth-error">

                        {error}

                    </div>

                }

                <button>

                    Login

                </button>

                <span>

                    Don't have an account?

                    <Link to="/signup">

                        Sign Up

                    </Link>

                </span>

            </form>

        </div>

    );

}