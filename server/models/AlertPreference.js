const mongoose = require("mongoose");

const alertPreferenceSchema = new mongoose.Schema(
{
    username: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        default: ""
    },

    enabled: {
        type: Boolean,
        default: true
    }

},
{
    timestamps: true
});

module.exports = mongoose.model(
    "AlertPreference",
    alertPreferenceSchema
);