"use strict";
const Joi = require("@hapi/joi");

module.exports = {
    addBusinessValidation: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
        status: Joi.string().required()
    })
}