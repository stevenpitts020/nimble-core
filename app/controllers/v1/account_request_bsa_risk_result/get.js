const _ = require('lodash')
const app = require('../../../core')

const service = app.services.bsaRiskResult
const serializer = app.serializers.v1.bsaRiskResult

async function get(req, res, next) {
  const id = req.params.id
  const params = _.pick(req.query, 'sort')

  return service
    .list({ ...params, accountRequestId: id })
    .then((data) => data.map(serializer))
    .then((data) => res.status(200).json(data))
    .catch(next)
}

module.exports = get
