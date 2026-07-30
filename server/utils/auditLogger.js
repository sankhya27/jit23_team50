const AuditLog = require("../models/AuditLog");

async function logAudit({

    username,

    role,

    action,

    description,

    ipAddress,

    status = "Success"

}) {

    try {

        await AuditLog.create({

            username,

            role,

            action,

            description,

            ipAddress,

            status

        });

    }

    catch (err) {

        console.log("Audit Log Error:", err.message);

    }

}

module.exports = logAudit;