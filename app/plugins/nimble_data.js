const _ = require('lodash')
const config = require('../../config')
const InternalServerError = require('../errors/internal_server')
const logger = require('./logger').getLogger('app.plugins.nimble_data')

const axios = require('axios')
const headers = { 'x-api-key': config.get('nimbleData.apiKey') }

const endpoint = (() => {
  const tmp = config.get('nimbleData.endpoint')
  return tmp.endsWith('/') ? tmp : tmp + '/'
})()

function _url(path) {
  return endpoint + (path.startsWith('/') ? path.substring(0, path.length - 1) : path)
}

async function post(path, data) {
  const url = _url(path)

  try {
    logger.info({ op: 'post', phase: 'delegate', url, data})
    const res = await axios.post(url, data, { headers })
    logger.info({ op: 'post', phase: 'completed', url, status: res.status})
    return res.data
  } catch(err) {
    logger.error(err, _.get(err, 'response.data') || `failed without response from ${url}`)
    throw new InternalServerError(err.message)
  }
}

async function get(path, params) {
  const url = _url(path)

  try {
    logger.info({ op: 'get', phase: 'delegate', url, params})
    const res = await axios.get(url, { params, headers })
    logger.info({ op: 'get', phase: 'completed', url, status: res.status})
    return res.data
  } catch(err) {
    logger.error(err, _.get(err, 'response.data') || `failed without response from ${url}`)
    throw new InternalServerError(err.message)
  }
}

module.exports = {
  get,
  post
}