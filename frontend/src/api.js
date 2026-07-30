const API = "http://localhost:5001/api";

function authHeader() {

    const token = localStorage.getItem("token");

    return {

        Authorization: `Bearer ${token}`

    };

}

// =====================================================
// METRICS
// =====================================================

export async function getMetrics() {

    const res = await fetch(`${API}/metrics`, {

        cache: "no-store"

    });

    return await res.json();

}

// =====================================================
// PREDICTION
// =====================================================

export async function predictTraffic(data) {

    const res = await fetch(`${API}/predict`, {

        method: "POST",

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify(data)

    });

    return await res.json();

}

// =====================================================
// SIMULATION
// =====================================================

export async function startSimulation(type) {

    const res = await fetch(`${API}/simulate/start`, {

        method: "POST",

        headers: {

            ...authHeader(),

            "Content-Type": "application/json"

        },

        body: JSON.stringify({

            attack_type: type

        })

    });

    return await res.json();

}

export async function stopSimulation() {

    const res = await fetch(`${API}/simulate/stop`, {

        method: "POST",

        headers: authHeader()

    });

    return await res.json();

}

// =====================================================
// INCIDENTS
// =====================================================

export async function getIncidents() {

    const res = await fetch(`${API}/incidents`, {

        headers: authHeader(),

        cache: "no-store"

    });

    return await res.json();

}

// =====================================================
// DETECTION HISTORY
// =====================================================

export async function getHistory() {

    const res = await fetch(`${API}/history`, {

        headers: authHeader(),

        cache: "no-store"

    });

    return await res.json();

}

// =====================================================
// USERS
// =====================================================

export async function getUsers() {

    const res = await fetch(`${API}/users`, {

        headers: authHeader(),

        cache: "no-store"

    });

    return await res.json();

}

export async function updateUserRole(id, role) {

    const res = await fetch(`${API}/users/${id}/role`, {

        method: "PATCH",

        headers: {

            ...authHeader(),

            "Content-Type": "application/json"

        },

        body: JSON.stringify({

            role

        })

    });

    return await res.json();

}

export async function deleteUser(id) {

    const res = await fetch(`${API}/users/${id}`, {

        method: "DELETE",

        headers: authHeader()

    });

    return await res.json();

}