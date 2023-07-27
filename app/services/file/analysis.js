const _ = require('lodash')
const app = require('../../core')
const axios = require('axios')
const NotFoundError = require('../../errors/not_found')
const InternalServerError = require('../../errors/internal_server')
const logger = app.logger.getLogger('app.services.file.analysis')

async function analysis(file, processor = 'table/financial-statement', tx = app.db) {
  logger.info({ op: 'analysis', phase: 'started', file, processor })

  if (_.isString(file)) file = await app.services.file.get(file, tx)

  if (!file) throw new NotFoundError(`file[${file}]`)

  const endpoint = app.config.get('nimbleData.endpoint')
  const apiUrl = endpoint + (endpoint.endsWith('/') ? '' : '/') + `image-processors/${processor}`
  const document = { Bucket: file.bucket, Name: file.key }
  const headers = { 'x-api-key': app.config.get('nimbleData.apiKey') }

  logger.info({ op: 'analysis', phase: 'prepared', request: { endpoint, apiUrl, document, headers } })

  try {
    const res = await axios.post(apiUrl, { document }, { headers })
    logger.info({ op: 'analysis', phase: 'completed', file })
    return res.data
  } catch(err) {
    logger.error(err, _.get(err, 'response.data') || `failed without response from ${apiUrl}`)
    throw new InternalServerError(err.message)
  }
}

module.exports = analysis
