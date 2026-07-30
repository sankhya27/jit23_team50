const axios = require("axios");

const ML_URL =
    process.env.ML_SERVICE_URL ||
    "http://localhost:5000";

const ML_TIMEOUT_MS = 5000;

const mlClient = axios.create({

    baseURL: ML_URL,

    timeout: ML_TIMEOUT_MS,

    headers: {
        "Content-Type": "application/json"
    }

});

/**
 * Call Flask ML microservice.
 *
 * An AbortSignal can be supplied so the simulator
 * can cancel an ML request when its own timeout expires.
 */
async function getPrediction(
    trafficData,
    signal = undefined
) {

    try {

        const { data } =
            await mlClient.post(

                "/ml/predict",

                trafficData,

                {
                    signal
                }

            );

        return {

            ok: true,

            data

        };

    }

    catch (err) {

        // --------------------------------------------------
        // Request was deliberately cancelled
        // --------------------------------------------------

        if (
            err.name === "CanceledError" ||
            err.code === "ERR_CANCELED" ||
            err.name === "AbortError"
        ) {

            return {

                ok: false,

                status: 408,

                cancelled: true,

                error:
                    "ML prediction request was cancelled."

            };

        }

        // --------------------------------------------------
        // Flask returned an HTTP error
        // --------------------------------------------------

        if (err.response) {

            return {

                ok: false,

                status:
                    err.response.status,

                error:
                    err.response.data?.error ||
                    "ML service error"

            };

        }

        // --------------------------------------------------
        // Flask unreachable / connection failure
        // --------------------------------------------------

        return {

            ok: false,

            status: 503,

            error:
                "ML service is unreachable. Please start the Python backend."

        };

    }

}

/**
 * Health check for ML service.
 */
async function checkHealth() {

    try {

        const { data } =
            await mlClient.get(

                "/ml/health",

                {
                    timeout: 2000
                }

            );

        return data;

    }

    catch {

        return {

            status:
                "unreachable"

        };

    }

}

module.exports = {

    getPrediction,

    checkHealth

};