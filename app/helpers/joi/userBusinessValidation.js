const Joi = require("@hapi/joi");

module.exports = {
    addBusinessSchema: Joi.object({
        user_id: Joi.number().required(),
        business_id: Joi.number().required(),
      })
}