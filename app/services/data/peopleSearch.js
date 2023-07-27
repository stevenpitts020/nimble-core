const _ = require('lodash')
const app = require('../../core')
const axios = require('axios')
const InternalServerError = require('../../errors/internal_server')

const logger = app.logger.getLogger('app.services.data.people.search')

async function peopleSearch(query) {
  logger.info({ op: 'people.search', phase: 'started', query })

  if (!_.isObject(query) || _.isEmpty(query)) throw new Error('query required but not provided')

  const endpoint = app.config.get('nimbleData.apiEndpoint')
  const apiUrl = endpoint + (endpoint.endsWith('/') ? '' : '/') + 'people/search'
  const headers = { 'x-api-key': app.config.get('nimbleData.apiKey') } // FIXME: should allow institutions to manage

  logger.info({ op: 'people.search', phase: 'prepared', request: { endpoint, apiUrl, headers, data: query } })

  try {
    const res = await axios.post(apiUrl, query, { headers })
    logger.info({ op: 'people.search', phase: 'completed', count: _.size(_.get(res, ['data', 'hits'])) })
    return res.data
  } catch(err) {
    logger.error(err, _.get(err, ['response', 'data']) || `failed without response from ${apiUrl}`)
    throw new InternalServerError(err.message)
  }
}

module.exports = peopleSearch