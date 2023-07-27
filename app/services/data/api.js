const _ = require('lodash')
const app = require('../../core')
const axios = require('axios')
const InternalServerError = require('../../errors/internal_server')

const logger = app.logger.getLogger('app.services.data.api')

async function api(method, path, params, data) {
  if (params && !data) data = params // coerce data to params when not provided

  logger.info({ op: 'data.api', phase: 'started', method, path, params, data })

  const endpoint = app.config.get('nimbleData.endpoint')
  const apiUrl = _.trimEnd(endpoint, '/') + '/' + _.trimStart(path, '/')
  const headers = { 'x-api-key': app.config.get('nimbleData.apiKey') } // FIXME: should allow institutions to manage

  logger.info({ op: 'data.api', phase: 'prepared', request: { endpoint, apiUrl, headers, method, params, data } })

  try {
    const res = await {
      get: () => axios.get(apiUrl, { params, headers }),
      post: () => axios.post(apiUrl, data, { headers })
    }[method]()

    logger.info({ op: 'data.api', phase: 'completed' })
    return res.data
  } catch(err) {
    logger.error(err, _.get(err, ['response', 'data']) || `failed without response from ${apiUrl}`)
    throw new InternalServerError(err.message)
  }
}

module.exports = api