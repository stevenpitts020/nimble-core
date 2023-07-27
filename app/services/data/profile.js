const _ = require('lodash')
const app = require('../../core')
const axios = require('axios')
const InternalServerError = require('../../errors/internal_server')

const logger = app.logger.getLogger('app.services.data.profile')

async function profile(params) {
  logger.info({ op: 'profile', phase: 'started', params })

  const endpoint = app.config.get('nimbleData.apiEndpoint')
  const apiUrl = endpoint + (endpoint.endsWith('/') ? '' : '/') + 'profiles'
  const config = { headers: { 'x-api-key': app.config.get('nimbleData.apiKey') }, params } // FIXME: should allow institutions to manage

  logger.info({ op: 'profile', phase: 'prepared', request: { endpoint, apiUrl, config } })

  try {
    const res = await axios.get(apiUrl, config)
    logger.info({ op: 'profile', phase: 'completed' })
    return _.get(res, ['data'])
  } catch(err) {
    logger.error(err, _.get(err, ['response', 'data']) || `failed without response from ${apiUrl}`)
    throw new InternalServerError(err.message)
  }
}

module.exports = profile