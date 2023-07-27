const Joi = require('@hapi/joi')
const moment = require('moment')
const _ = require('lodash')

const app = require('../../core')
const getApiUri = require('../api/uri')
const jwt = app.plugins.jwt

function schema() {
  return Joi.object().keys({
    userId: Joi.string().optional().default(null),
    scopes: Joi.array().items(Joi.string()).min(1).default(['*']),
    resources: Joi.array().items(Joi.string()).min(1).default(['*']),
    expiration: Joi.number().positive().default(900),
    phone: Joi.string().optional()
  })
}

// public claims - https://tools.ietf.org/html/rfc7519#section-4.1
function getTokenInfo(options) {
  const now = moment()
  const publicClaims = {
    iss: getApiUri(),
    sub: getApiUri(`/v1/users/${options.userId}`),
    aud: getApiUri(),
    exp: moment(now).add(options.expiration, 's').unix(),
    iat: moment(now).unix()
  }
  const privateClaims = _.pick(options, 'userId', 'scopes', 'resources')
  return _.defaults({}, privateClaims, publicClaims)
}

function validate(options) {
  const data = schema().validate(options, {abortEarly: true})
  if (data.error) {
    throw new Error(data.error.details[0].message)
  }
  return data.value
}

/**
 * Generates a access token for the specified resources and expiration
 *
 * @param {Object}    options
 * @param {string}    options.userId user unique identifier
 * @param {string[]}  options.scopes, defaults to everything using *
 * @param {string[]}  options.resources, defaults to everything using *
 * @param {number}    options.expiration in seconds, defaults to 15m
 */
function get(options) {
  const data = validate(options)
  const tokenData = getTokenInfo(data)
  return jwt.encode(tokenData)
}

module.exports = get
