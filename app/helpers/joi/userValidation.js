const Joi = require("@hapi/joi");
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),

  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),

  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ["com", "net"] },
  }),

  mobile: Joi.string().pattern(new RegExp("^[0-9]{10}$")).min(10).max(10),
});

const editSchema = Joi.object({
  id: Joi.string().optional(),
  username: Joi.string().alphanum().min(3).max(30).optional(),

  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).optional(),

  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .optional(),

  mobile: Joi.string()
    .pattern(new RegExp("^[0-9]{10}$"))
    .min(10)
    .max(10)
    .optional(),
  url: Joi.string().optional(),
  location: Joi.string().min(2).optional(),
  picture: Joi.string().optional(),
  token: Joi.string().required(),
  oldPhotoPath: Joi.string().required()
});

const removeSchema = Joi.object({
  id: Joi.string().required(),
  token: Joi.string().required()
});

const loginSchema = Joi.object({
  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ["com", "net"] },
  }).required(),
  password: Joi.string().required(),
});

const logoutSchema = Joi.object({
  token: Joi.string().required()
})
module.exports = {
  registerSchema,
  editSchema,
  removeSchema,
  loginSchema,
  logoutSchema
};
