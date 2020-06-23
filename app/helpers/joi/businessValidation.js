"use strict";
const Joi = require("@hapi/joi");

module.exports = {
    addBusinessValidation: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
        status: Joi.string().required()
    }),
    editBusinessValidation: Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        description: Joi.string().optional(),
        status: Joi.string().optional()
    }),
    deleteBusinessValidation: Joi.object({
        id: Joi.number().required()
    })
}