const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

    host: "smtp.gmail.com",

    port: 465,

    secure: true,

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

});

transporter.verify(function(err){

    if(err){

        console.log("MAIL SERVER ERROR");
        console.log(err);

    }else{

        console.log("✅ Mail server ready");

    }

});

async function sendAttackAlert(incident){

    const info = await transporter.sendMail({

        from: `"DDoS Guard" <${process.env.EMAIL_USER}>`,

        to: process.env.ALERT_EMAIL,

        subject: `🚨 ${incident.severity.toUpperCase()} DDoS Attack Detected`,

        html: `

        <h2>DDoS Attack Detected</h2>

        <p><b>Attack Type:</b> ${incident.attackType}</p>

        <p><b>Severity:</b> ${incident.severity}</p>

        <p><b>Source IP:</b> ${incident.sourceIP}</p>

        <p><b>Confidence:</b> ${incident.detection.confidence}</p>

        <p><b>Latency:</b> ${incident.detection.latencyMs} ms</p>

        <hr>

        <p>This alert was generated automatically by DDoS Guard.</p>

        `

    });

    console.log("✅ Email sent");

    console.log(info.response);

}

module.exports={sendAttackAlert};