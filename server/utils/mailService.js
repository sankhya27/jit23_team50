require("dotenv").config();

const nodemailer =
    require("nodemailer");

const User =
    require("../models/User");


// =====================================================
// MAIL TRANSPORT
// =====================================================

const transporter =
    nodemailer.createTransport({

        host:
            "smtp.gmail.com",

        port:
            465,

        secure:
            true,

        auth: {

            user:
                process.env.EMAIL_USER,

            pass:
                process.env.EMAIL_PASS

        }

    });


// =====================================================
// VERIFY MAIL SERVER
// =====================================================

transporter.verify(
    (err) => {

        if (err) {

            console.log(
                "MAIL SERVER ERROR"
            );

            console.log(err);

        }

        else {

            console.log(
                "✅ Mail server ready"
            );

        }

    }
);


// =====================================================
// SEND ATTACK ALERT
// =====================================================

async function sendAttackAlert(
    username,
    incident
) {

    try {

        if (!username) {

            console.log(
                "⚠ No username provided. Email skipped."
            );

            return false;

        }


        // -------------------------------------------------
        // ALWAYS READ CURRENT USER SETTINGS
        // -------------------------------------------------

        const user =
            await User.findOne({

                username

            });


        if (!user) {

            console.log(
                `⚠ User ${username} not found. Email skipped.`
            );

            return false;

        }


        // -------------------------------------------------
        // CHECK EMAIL NOTIFICATION SETTING
        // -------------------------------------------------

        const notificationsEnabled =
            user.emailNotifications ??
            true;


        if (!notificationsEnabled) {

            console.log(

                `📭 Email notifications disabled for ${username}. Alert skipped.`

            );

            return false;

        }


        // -------------------------------------------------
        // CHECK DESTINATION
        // -------------------------------------------------

        const destination =
            user.alertEmail?.trim() ||
            user.email?.trim();

        if (!destination) {

            console.log(

                    `⚠ No alert email configured for ${username}.`

            );

            return false;

        }


        // -------------------------------------------------
        // SEND EMAIL
        // -------------------------------------------------

        const info =
            await transporter.sendMail({

                from:
                    `"DDoS Guard" <${process.env.EMAIL_USER}>`,

                to:
                    destination,

                subject:
                    `🚨 ${incident.severity.toUpperCase()} DDoS Attack Detected`,

                html: `

                <div
                    style="
                        font-family:Arial;
                        padding:25px;
                        background:#f5f7fb;
                    "
                >

                    <div
                        style="
                            background:#081b2d;
                            color:white;
                            padding:18px;
                            border-radius:8px;
                        "
                    >

                        <h2>
                            🚨 DDoS Guard Security Alert
                        </h2>

                    </div>


                    <div
                        style="
                            background:white;
                            padding:20px;
                            border-radius:8px;
                        "
                    >

                        <p>

                            <b>
                                Attack Type:
                            </b>

                            ${incident.attackType}

                        </p>


                        <p>

                            <b>
                                Severity:
                            </b>

                            ${incident.severity}

                        </p>


                        <p>

                            <b>
                                Source IP:
                            </b>

                            ${incident.sourceIP}

                        </p>


                        <p>

                            <b>
                                Confidence:
                            </b>

                            ${incident.detection.confidence}

                        </p>


                        <p>

                            <b>
                                Detection Latency:
                            </b>

                            ${incident.detection.latencyMs}
                            ms

                        </p>


                        <hr>


                        <p>

                            DDoS Guard detected suspicious
                            network activity and generated
                            this security alert automatically.

                        </p>


                        <p>

                            Login to the DDoS Guard dashboard
                            to investigate the incident.

                        </p>

                    </div>

                </div>

                `

            });


        console.log(
            `✅ Attack email sent to ${destination}`
        );

        console.log(
            info.response
        );


        return true;

    }

    catch (err) {

        console.error(

            "❌ Email sending failed:",

            err.message

        );

        return false;

    }

}


// =====================================================
// SEND TEST EMAIL
// =====================================================

async function sendTestAlert(
    email
) {

    if (!email) {

        throw new Error(
            "Email address is required."
        );

    }


    const info =
        await transporter.sendMail({

            from:
                `"DDoS Guard" <${process.env.EMAIL_USER}>`,

            to:
                email,

            subject:
                "🧪 DDoS Guard Test Email",

            html: `

            <div
                style="
                    font-family:Arial;
                    padding:20px;
                "
            >

                <h2>
                    Test Successful ✅
                </h2>


                <p>

                    Your DDoS Guard email
                    notifications are configured
                    correctly.

                </p>


                <p>

                    Time:

                    ${new Date().toLocaleString()}

                </p>

            </div>

            `

        });


    console.log(
        "✅ Test email sent"
    );

    console.log(
        info.response
    );


    return true;

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    sendAttackAlert,

    sendTestAlert

};