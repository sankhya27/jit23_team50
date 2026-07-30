import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import "../styles/auth.css";

const API = "http://localhost:5001/api";

export default function Signup() {

    const navigate = useNavigate();

    const [form, setForm] = useState({

        username: "",

        email: "",

        password: "",

        role: "analyst",

        adminKey: ""

    });

    const [error, setError] = useState("");

    function update(e) {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    }

    async function submit(e) {

        e.preventDefault();

        setError("");

        const res = await fetch(`${API}/auth/signup`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(form)

        });

        const data = await res.json();

        if (!res.ok) {

            setError(data.error || data.message);

            return;

        }

        navigate("/login");

    }

    return (

        <div className="auth-page">

            <form

                className="auth-card"

                onSubmit={submit}

            >

                <h1>Create Account</h1>

                <input

                    name="username"

                    placeholder="Username"

                    value={form.username}

                    onChange={update}

                    required

                />

                <input

                    name="email"

                    type="email"

                    placeholder="Email"

                    value={form.email}

                    onChange={update}

                    required

                />

                <input

                    type="password"

                    name="password"

                    placeholder="Password"

                    value={form.password}

                    onChange={update}

                    required

                />

                <label className="auth-label">

                    Account Type

                </label>

                <select

                    name="role"

                    value={form.role}

                    onChange={update}

                >

                    <option value="analyst">

                        Analyst

                    </option>

                    <option value="admin">

                        Admin

                    </option>

                </select>

                {

                    form.role === "admin" &&

                    <input

                        type="password"

                        name="adminKey"

                        placeholder="Admin Secret Key"

                        value={form.adminKey}

                        onChange={update}

                        required

                    />

                }

                {

                    error &&

                    <div className="auth-error">

                        {error}

                    </div>

                }

                <button>

                    Create Account

                </button>

                <span>

                    Already registered?

                    <Link to="/login">

                        Login

                    </Link>

                </span>

            </form>

        </div>

    );

}