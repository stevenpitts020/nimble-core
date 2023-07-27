const _ = require('lodash')
const app = require('../../../core')

const service = app.services.creditReport
const serializer = app.serializers.v1.signerCreditReport

function list(req, res, next) {
  const id = req.params.id
  const params = _.pick(req.query, 'limit', 'offset', 'sort')

  return service
    .list({ ...params, signerId: id })
    .then((data) => data.map(serializer))
    .then((data) => res.status(200).json(data))
    .catch(next)
}

module.exports = list
