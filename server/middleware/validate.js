const Joi = require("joi");

const schemas = {

    signup: Joi.object({

        username: Joi.string()

            .alphanum()

            .min(3)

            .max(30)

            .required(),

        email: Joi.string()

            .email({

                tlds: {

                    allow: false

                }

            })

            .required(),

        password: Joi.string()

            .min(6)

            .max(100)

            .required(),

        role: Joi.string()

            .valid(

                "admin",

                "analyst"

            )

            .default("analyst"),

        adminKey: Joi.string()

            .allow("")

            .optional()

    }),

    login: Joi.object({

        username: Joi.string()

            .required(),

        password: Joi.string()

            .required()

    }),

    predict: Joi.object({

        packet_rate: Joi.number()

            .min(0)

            .max(1000000000)

            .required(),

        duration: Joi.number()

            .min(0)

            .max(1000000000)

            .required(),

        byte_count: Joi.number()

            .min(0)

            .max(10000000000)

            .required(),

        protocol: Joi.string().optional(),

        syn_flags: Joi.number().optional(),

        total_packets: Joi.number().optional(),

        packets_from_source: Joi.number().optional(),

        avg_packet_size: Joi.number().optional(),

        packet_count: Joi.number().optional(),

        packet_size: Joi.number().optional()

    }),

    simulate: Joi.object({

        attack_type: Joi.string()

            .valid(

                "random",

                "normal",

                "syn",

                "udp",

                "http"

            )

            .default("random")

    })

};

function validate(schemaName) {

    return (req, res, next) => {

        const schema = schemas[schemaName];

        if (!schema)

            return next();

        const { error, value } = schema.validate(

            req.body,

            {

                abortEarly: false

            }

        );

        if (error) {

            return res.status(400).json({

                error: "Validation failed",

                details: error.details.map(

                    d => d.message

                )

            });

        }

        req.body = value;

        next();

    };

}

module.exports = {

    validate

};