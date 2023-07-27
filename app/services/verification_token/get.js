const moment = require('moment')
const _ = require('lodash')
const jwtSimple = require('jwt-simple')
const config = require('../../../config')

const app = require('../../core')
const getApiUri = require('../api/uri')
const Joi = require('@hapi/joi')
const { validator } = app.plugins

const whitelist = ["id","expiration"]
const schema = Joi.object().keys({
  id: Joi.string().required(),
  expiration: Joi.number().required()
})

// public claims - https://tools.ietf.org/html/rfc7519#section-4.1
function getTokenInfo(options) {
  const now = moment()
  const publicClaims = {
    iss: getApiUri(),
    sub: getApiUri(`/v1/phones/${options.id}`),
    aud: getApiUri(),
    exp: moment(now).add(options.expiration, 's').unix(),
    iat: moment(now).unix()
  }
  const privateClaims = _.pick(options, 'id')
  return _.defaults({}, privateClaims, publicClaims)
}

async function validate(options) {
  const data = _.pick(options, whitelist)
  return validator(data, schema, { abortEarly: false })
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
async function get(options) {
  const data = await validate(options)
  const tokenData = getTokenInfo(data)
  return  jwtSimple.encode(tokenData, config.get('auth').secret)
}

module.exports = get
