const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        // =====================================================
        // USERNAME
        // =====================================================

        username: {
            type: String,

            required: [
                true,
                "Username is required"
            ],

            unique: true,

            trim: true,

            minlength: [
                3,
                "Username must be at least 3 characters"
            ],

            maxlength: [
                30,
                "Username must be at most 30 characters"
            ]
        },

        // =====================================================
        // ACCOUNT / PROFILE EMAIL
        // =====================================================

        email: {
            type: String,

            required: [
                true,
                "Email is required"
            ],

            unique: true,

            trim: true,

            lowercase: true,

            match: [
                /^\S+@\S+\.\S+$/,

                "Invalid email format"
            ]
        },

        // =====================================================
        // ATTACK ALERT EMAIL
        //
        // This is intentionally separate from the user's
        // profile email.
        //
        // Example:
        //
        // email:
        //     sankhya@gmail.com
        //
        // alertEmail:
        //     securityalerts@gmail.com
        //
        // The user can change alertEmail from Settings.
        // =====================================================

        alertEmail: {
            type: String,

            trim: true,

            lowercase: true,

            default: "",

            match: [
                /^$|^\S+@\S+\.\S+$/,

                "Invalid alert email format"
            ]
        },

        // =====================================================
        // PASSWORD
        // =====================================================

        passwordHash: {
            type: String,

            required: true
        },

        // =====================================================
        // ROLE
        // =====================================================

        role: {
            type: String,

            enum: [
                "admin",
                "analyst"
            ],

            default: "analyst"
        },

        // =====================================================
        // EMAIL NOTIFICATION PREFERENCE
        //
        // true  = send attack alert emails
        // false = do not send attack alert emails
        // =====================================================

        emailNotifications: {

    type: Boolean,

    default: true

},

    },

    {
        timestamps: true
    }
);


// =====================================================
// HASH PASSWORD BEFORE SAVE
// =====================================================

userSchema.pre(
    "save",
    async function (next) {

        if (!this.isModified("passwordHash")) {

            return next();

        }

        this.passwordHash =
            await bcrypt.hash(
                this.passwordHash,
                12
            );

        next();

    }
);


// =====================================================
// COMPARE PASSWORD
// =====================================================

userSchema.methods.comparePassword =
    function (plain) {

        return bcrypt.compare(
            plain,
            this.passwordHash
        );

    };


// =====================================================
// PUBLIC USER DATA
// =====================================================

userSchema.methods.toPublic =
    function () {

        return {

            id: this._id,

            username:
                this.username,

            email:
                this.email,

            alertEmail:
                this.alertEmail,

            role:
                this.role,

            emailNotifications:
                this.emailNotifications,

            createdAt:
                this.createdAt

        };

    };


// =====================================================
// EXPORT
// =====================================================

module.exports =
    mongoose.model(
        "User",
        userSchema
    );