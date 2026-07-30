const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { signToken, verifyToken } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const logAudit = require("../utils/auditLogger");

// -----------------------------------------------------
// In-memory fallback
// -----------------------------------------------------

const _memUsers = [];

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

function mongoAvailable() {
    return mongoose.connection.readyState === 1;
}

async function findUserByUsername(username) {
    if (mongoAvailable()) {
        const User = require("../models/User");
        return User.findOne({ username });
    }

    return _memUsers.find(
        u => u.username === username
    ) || null;
}

async function findUserByEmail(email) {
    if (mongoAvailable()) {
        const User = require("../models/User");
        return User.findOne({ email });
    }

    return _memUsers.find(
        u => u.email === email
    ) || null;
}

// -----------------------------------------------------
// SIGNUP
// -----------------------------------------------------

router.post(
    "/signup",
    validate("signup"),
    async (req, res, next) => {

        try {

            const {
                username,
                email,
                password,
                role,
                adminKey
            } = req.body;

            if (await findUserByUsername(username)) {

                return res.status(409).json({

                    error: "Username already taken."

                });

            }

            if (await findUserByEmail(email)) {

                return res.status(409).json({

                    error: "Email already registered."

                });

            }

            let finalRole = "analyst";

            if (role === "admin") {

                if (
                    !adminKey ||
                    adminKey !== process.env.ADMIN_SECRET_KEY
                ) {

                    return res.status(403).json({

                        error: "Invalid Admin Secret Key."

                    });

                }

                finalRole = "admin";

            }

            let user;

            if (mongoAvailable()) {

                const User = require("../models/User");

                user = new User({

                    username,

                    email,

                    passwordHash: password,

                    role: finalRole

                });

                await user.save();

            }

            else {

                const passwordHash = await bcrypt.hash(

                    password,

                    12

                );

                user = {

                    _id: Date.now().toString(),

                    username,

                    email,

                    passwordHash,

                    role: finalRole

                };

                _memUsers.push(user);

            }

            await logAudit({

                username: user.username,

                role: user.role,

                action: "User Signup",

                description: `New ${user.role} account created`,

                ipAddress: req.ip,

                status: "Success"

            });

            const token = signToken({

                id: user._id,

                username: user.username,

                role: user.role

            });

            res.status(201).json({

                status: "success",

                token,

                user: {

                    id: user._id,

                    username: user.username,

                    email: user.email,

                    role: user.role

                }

            });

        }

        catch (err) {

            next(err);

        }

    }

);

// -----------------------------------------------------
// LOGIN
// -----------------------------------------------------

router.post(
    "/login",
    validate("login"),
    async (req, res, next) => {

        try {

            const {

                username,

                password

            } = req.body;

            const user = await findUserByUsername(username);

            if (!user) {

                await logAudit({

                    username,

                    role: "Unknown",

                    action: "Login Failed",

                    description: "Username not found",

                    ipAddress: req.ip,

                    status: "Failed"

                });

                return res.status(401).json({

                    error: "Invalid username or password."

                });

            }

            const match = await bcrypt.compare(

                password,

                user.passwordHash

            );

            if (!match) {

                await logAudit({

                    username,

                    role: user.role,

                    action: "Login Failed",

                    description: "Incorrect password",

                    ipAddress: req.ip,

                    status: "Failed"

                });

                return res.status(401).json({

                    error: "Invalid username or password."

                });

            }

            await logAudit({

                username: user.username,

                role: user.role,

                action: "User Login",

                description: "Logged into DDoS Guard",

                ipAddress: req.ip,

                status: "Success"

            });

            const token = signToken({

                id: user._id,

                username: user.username,

                role: user.role

            });

            res.json({

                status: "success",

                token,

                user: {

                    id: user._id,

                    username: user.username,

                    email: user.email,

                    role: user.role

                }

            });

        }

        catch (err) {

            next(err);

        }

    }

);

// -----------------------------------------------------
// CURRENT USER
// -----------------------------------------------------

router.get(
    "/me",
    verifyToken,
    async (req, res, next) => {

        try {

            const user = await findUserByUsername(
                req.user.username
            );

            if (!user) {

                return res.status(404).json({

                    error: "User not found."

                });

            }

            res.json({

                id: user._id,

                username: user.username,

                email: user.email,

                role: user.role

            });

        }

        catch (err) {

            next(err);

        }

    }

);

// -----------------------------------------------------
// CHANGE PASSWORD
// -----------------------------------------------------

router.post(
    "/change-password",
    verifyToken,
    async (req, res, next) => {

        try {

            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    error: "currentPassword and newPassword are required."
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    error: "New password must be at least 6 characters."
                });
            }

            const user = await findUserByUsername(req.user.username);

            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }

            const match = await bcrypt.compare(currentPassword, user.passwordHash);

            if (!match) {
                return res.status(401).json({ error: "Current password is incorrect." });
            }

            const newHash = await bcrypt.hash(newPassword, 12);

            if (mongoAvailable()) {
                const User = require("../models/User");
                await User.findByIdAndUpdate(user._id, { passwordHash: newHash });
            } else {
                user.passwordHash = newHash;
            }

            await logAudit({
                username: req.user.username,
                role: req.user.role,
                action: "Password Changed",
                description: "User changed their password",
                ipAddress: req.ip,
                status: "Success"
            }).catch(() => {});

            res.json({ success: true, message: "Password updated successfully." });

        } catch (err) {
            next(err);
        }

    }
);

module.exports = router;