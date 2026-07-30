require("dotenv").config();

const nodemailer = require("nodemailer");
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "Loaded" : "Missing");
const transporter = nodemailer.createTransport({

    host: "smtp.gmail.com",

    port: 465,

    secure: true,

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

});

transporter.verify(function (err) {

    if (err) {

        console.log("MAIL SERVER ERROR");

        console.log(err);

    }

    else {

        console.log("✅ Mail server ready");

    }

});

// =====================================================
// SEND ATTACK ALERT
// =====================================================

async function sendAttackAlert(email, incident) {

    if (!email) {

        console.log("⚠ No email configured. Alert skipped.");

        return;

    }

    const info = await transporter.sendMail({

        from: `"DDoS Guard" <${process.env.EMAIL_USER}>`,

        to: email,

        subject: `🚨 ${incident.severity.toUpperCase()} DDoS Attack Detected`,

        html: `

        <div style="font-family:Arial;padding:25px;background:#f5f7fb">

            <div style="background:#081b2d;color:white;padding:18px;border-radius:8px">

                <h2>🚨 DDoS Guard Security Alert</h2>

            </div>

            <div style="background:white;padding:20px">

                <p><b>Attack Type:</b> ${incident.attackType}</p>

                <p><b>Severity:</b> ${incident.severity}</p>

                <p><b>Source IP:</b> ${incident.sourceIP}</p>

                <p><b>Confidence:</b> ${incident.detection.confidence}</p>

                <p><b>Latency:</b> ${incident.detection.latencyMs} ms</p>

                <hr>

                <p>

                This attack was automatically detected by

                <b>DDoS Guard</b>.

                </p>

            </div>

        </div>

        `

    });

    console.log("✅ Alert Email Sent");

    console.log(info.response);

}

// =====================================================
// SEND TEST EMAIL
// =====================================================

async function sendTestAlert(email) {

    if (!email) {

        throw new Error("Email address not provided");

    }

    const info = await transporter.sendMail({

        from: `"DDoS Guard" <${process.env.EMAIL_USER}>`,

        to: email,

        subject: "🧪 DDoS Guard Test Alert",

        html: `

        <div style="font-family:Arial;padding:25px">

            <h2>🧪 Test Alert</h2>

            <p>

            Congratulations!

            </p>

            <p>

            Your email notification settings are working correctly.

            </p>

            <hr>

            <p>

            Time :

            ${new Date().toLocaleString()}

            </p>

        </div>

        `

    });

    console.log("✅ Test Email Sent");

    console.log(info.response);

}

module.exports = {

    sendAttackAlert,

    sendTestAlert

};