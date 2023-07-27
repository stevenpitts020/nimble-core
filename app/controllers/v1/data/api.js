const _ = require('lodash')
const app = require('../../../core')
const service = app.services.data

async function api(req, res) {
  const data = await service.api(
    _.get(req, ['query', 'method'], 'get'),
    _.get(req, ['query', 'path'], 'people'),
    _.omit(_.get(req, ['query'], {}), ['method', 'path']),
    _.get(req, 'body')
  )

  res.status(200).json(data)
}

module.exports = api