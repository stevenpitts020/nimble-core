const _ = require('lodash')
const BadRequestError = require('../errors/bad_request')

function toValidationError(error) {
  return _.map(error.details, (validation) => {
    return validation.message
  }).join('.')
}

function processError(error) {
  if (error.isJoi) {
    const errMsg = 'The minimal required parameters for this endpoint were not met. '
    const validationError = toValidationError(error)
    throw new BadRequestError(errMsg + validationError)
  }

  throw error
}

function validator(payload, schema, options) {
  const {error, value} = schema.validate(payload, options || {})
  if(error) {
    processError(error)
  }
  return value
}

module.exports = validator
