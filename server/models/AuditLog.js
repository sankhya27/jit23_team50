const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({

    username: {

        type: String,

        required: true

    },

    role: {

        type: String,

        default: "analyst"

    },

    action: {

        type: String,

        required: true

    },

    description: {

        type: String,

        required: true

    },

    ipAddress: {

        type: String,

        default: "Unknown"

    },

    status: {

        type: String,

        enum: [

            "Success",

            "Failed"

        ],

        default: "Success"

    }

},

{

    timestamps: true

});

module.exports = mongoose.model(

    "AuditLog",

    auditLogSchema

);