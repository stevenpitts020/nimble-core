const Joi = require('@hapi/joi')

function schema() {
  return Joi.object().keys({
    accountRequestId: Joi.string().uuid(),
    sort: Joi.string().valid('position', '-position', 'id', '-id').default('position'),
  })
}

module.exports = schema
