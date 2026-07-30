const express = require("express");

const router = express.Router();

const { verifyToken } =
    require("../middleware/auth");

const Incident =
    require("../models/Incident");

const logAudit =
    require("../utils/auditLogger");

// ======================================================
// GET INCIDENTS
// ======================================================

router.get(
    "/",
    verifyToken,
    async (req, res, next) => {

        try {

            const {
                role,
                username
            } = req.user;

            console.log(
                "STEP 1: incidents route reached"
            );

            // --------------------------------------------------
            // ADMIN
            // --------------------------------------------------

            // Admin can see every incident.
            //
            // This includes simulator-generated incidents.
            //
            // --------------------------------------------------

            const filter =
                role === "admin"
                    ? {}
                    : {
                        username
                    };

            console.log(
                "STEP 2: incident filter:",
                filter
            );

            // --------------------------------------------------
            // FETCH INCIDENTS
            // --------------------------------------------------

            console.log(
                "STEP 3: fetching incidents from MongoDB..."
            );

            const incidents =
                await Incident.getAll(
                    filter
                );

            console.log(
                "STEP 4: incidents fetched:",
                incidents.length
            );

            // --------------------------------------------------
            // AUDIT
            // --------------------------------------------------

            console.log(
                "STEP 5: writing audit log..."
            );

            await logAudit({

                username,

                role,

                action:
                    "Viewed Incidents",

                description:
                    `Viewed ${incidents.length} incident records`,

                ipAddress:
                    req.ip,

                status:
                    "Success"

            }).catch(err => {

                console.log(
                    "Audit error:",
                    err.message
                );

            });

            console.log(
                "STEP 6: audit completed"
            );

            // --------------------------------------------------
            // RESPONSE
            // --------------------------------------------------

            console.log(
                "STEP 7: sending incidents response"
            );

            return res.json({

                success: true,

                totalRecords:
                    incidents.length,

                incidents

            });

        }

        catch (err) {

            console.error(
                "INCIDENT ROUTE ERROR:",
                err
            );

            next(err);

        }

    }
);

// ======================================================
// RESOLVE INCIDENT
// ======================================================
//
// Support both:
//
// PATCH /api/incidents/:id/resolve
//
// PUT   /api/incidents/:id/resolve
//
// The frontend currently uses PATCH.
//
// ======================================================

router.patch(
    "/:id/resolve",
    verifyToken,
    resolveIncident
);

router.put(
    "/:id/resolve",
    verifyToken,
    resolveIncident
);

// ======================================================
// RESOLVE INCIDENT HANDLER
// ======================================================

async function resolveIncident(
    req,
    res,
    next
) {

    try {

        // --------------------------------------------------
        // ADMIN ONLY
        // --------------------------------------------------

        if (
            req.user.role !== "admin"
        ) {

            return res.status(403).json({

                success: false,

                error:
                    "Only admins can resolve incidents."

            });

        }

        // --------------------------------------------------
        // FIND INCIDENT
        // --------------------------------------------------

        const incident =
            await Incident.findById(
                req.params.id
            );

        if (!incident) {

            return res.status(404).json({

                success: false,

                error:
                    "Incident not found."

            });

        }

        // --------------------------------------------------
        // ALREADY RESOLVED
        // --------------------------------------------------

        if (incident.resolved) {

            return res.json({

                success: true,

                message:
                    "Incident is already resolved.",

                incident

            });

        }

        // --------------------------------------------------
        // RESOLVE
        // --------------------------------------------------

        incident.resolved =
            true;

        incident.resolvedAt =
            new Date();

        incident.resolvedBy =
            req.user.username;

        await incident.save();

        // --------------------------------------------------
        // AUDIT
        // --------------------------------------------------

        await logAudit({

            username:
                req.user.username,

            role:
                req.user.role,

            action:
                "Incident Resolved",

            description:
                `${incident.attackType} (${incident.severity}) resolved from ${incident.sourceIP}`,

            ipAddress:
                req.ip,

            status:
                "Success"

        }).catch(err => {

            console.log(
                "Audit error:",
                err.message
            );

        });

        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        return res.json({

            success: true,

            message:
                "Incident resolved successfully.",

            incident

        });

    }

    catch (err) {

        next(err);

    }

}

// ======================================================
// DELETE INCIDENT
// ======================================================

router.delete(
    "/:id",
    verifyToken,
    async (req, res, next) => {

        try {

            // --------------------------------------------------
            // ADMIN ONLY
            // --------------------------------------------------

            if (
                req.user.role !== "admin"
            ) {

                return res.status(403).json({

                    success: false,

                    error:
                        "Only admins can delete incidents."

                });

            }

            // --------------------------------------------------
            // DELETE
            // --------------------------------------------------

            const incident =
                await Incident.findByIdAndDelete(
                    req.params.id
                );

            if (!incident) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Incident not found."

                });

            }

            // --------------------------------------------------
            // AUDIT
            // --------------------------------------------------

            await logAudit({

                username:
                    req.user.username,

                role:
                    req.user.role,

                action:
                    "Incident Deleted",

                description:
                    `${incident.attackType} (${incident.severity}) deleted from ${incident.sourceIP}`,

                ipAddress:
                    req.ip,

                status:
                    "Success"

            }).catch(err => {

                console.log(
                    "Audit error:",
                    err.message
                );

            });

            // --------------------------------------------------
            // RESPONSE
            // --------------------------------------------------

            return res.json({

                success: true,

                message:
                    "Incident deleted successfully."

            });

        }

        catch (err) {

            next(err);

        }

    }
);

// ======================================================
// EXPORT
// ======================================================

module.exports =
    router;