const Joi = require('@hapi/joi')

function schema() {
  return Joi.object().keys({
    institutionId: Joi.string().uuid(),
    sort: Joi.string().valid('name', '-name', 'id', '-id').default('name'),
    limit: Joi.number().positive(),
    offset: Joi.number().positive().allow(0),
  })
}

module.exports = schema
