const express = require("express");
const router = express.Router();

const User = require("../models/User");

const { verifyToken } = require("../middleware/auth");

const logAudit = require("../utils/auditLogger");

// ======================================================
// GET ALL USERS
// ======================================================

router.get(

    "/",

    verifyToken,

    async (req, res, next) => {

        try {

            if (req.user.role !== "admin") {

                return res.status(403).json({

                    error: "Access denied."

                });

            }

            const users = await User.find()

                .select("-passwordHash")

                .sort({

                    createdAt: -1

                });

            res.json(users);

        }

        catch (err) {

            next(err);

        }

    }

);

// ======================================================
// CREATE USER
// ======================================================

router.post(

    "/",

    verifyToken,

    async (req, res, next) => {

        try {

            if (req.user.role !== "admin") {

                return res.status(403).json({

                    error: "Access denied."

                });

            }

            const {

                username,

                email,

                password,

                role

            } = req.body;

            const existing = await User.findOne({

                $or: [

                    {

                        username

                    },

                    {

                        email

                    }

                ]

            });

            if (existing) {

                return res.status(400).json({

                    error: "User already exists."

                });

            }

            const user = new User({

                username,

                email,

                passwordHash: password,

                role

            });

            await user.save();

            await logAudit({

                username: req.user.username,

                role: req.user.role,

                action: "User Created",

                description:

                    `Created ${role} account (${username})`,

                ipAddress: req.ip,

                status: "Success"

            });

            res.status(201).json({

                success: true,

                user: user.toPublic()

            });

        }

        catch (err) {

            next(err);

        }

    }

);

// ======================================================
// DELETE USER
// ======================================================

router.delete(

    "/:id",

    verifyToken,

    async (req, res, next) => {

        try {

            if (req.user.role !== "admin") {

                return res.status(403).json({

                    error: "Access denied."

                });

            }

            if (req.user.id === req.params.id) {

                return res.status(400).json({

                    error: "You cannot delete your own account."

                });

            }

            const user = await User.findById(

                req.params.id

            );

            if (!user) {

                return res.status(404).json({

                    error: "User not found."

                });

            }

            // Prevent deleting the last admin

            if (user.role === "admin") {

                const adminCount = await User.countDocuments({

                    role: "admin"

                });

                if (adminCount <= 1) {

                    return res.status(400).json({

                        error: "Cannot delete the last administrator."

                    });

                }

            }

            await User.findByIdAndDelete(

                req.params.id

            );

            await logAudit({

                username: req.user.username,

                role: req.user.role,

                action: "User Deleted",

                description:

                    `Deleted ${user.role} account (${user.username})`,

                ipAddress: req.ip,

                status: "Success"

            });

            res.json({

                success: true

            });

        }

        catch (err) {

            next(err);

        }

    }

);

module.exports = router;