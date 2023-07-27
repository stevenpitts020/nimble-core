const _ = require('lodash')
const app = require('../../core')
const axios = require('axios')
const InternalServerError = require('../../errors/internal_server')

const logger = app.logger.getLogger('app.services.data.people.schema')

async function peopleSchema() {
  logger.info({ op: 'people.model', phase: 'started' })

  const endpoint = app.config.get('nimbleData.apiEndpoint')
  const apiUrl = endpoint + (endpoint.endsWith('/') ? '' : '/') + 'docs'
  const headers = { 'x-api-key': app.config.get('nimbleData.apiKey') } // FIXME: should allow institutions to manage

  logger.info({ op: 'people.schema', phase: 'prepared', request: { endpoint, apiUrl, headers } })

  try {
    const res = await axios.get(apiUrl, { headers })
    logger.info({ op: 'people.schema', phase: 'completed' })
    return _.get(res, ['data', 'components', 'schemas', 'Person'])
  } catch(err) {
    logger.error(err, _.get(err, ['response', 'data']) || `failed without response from ${apiUrl}`)
    throw new InternalServerError(err.message)
  }
}

module.exports = peopleSchema