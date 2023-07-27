const _ = require('lodash')
const app = require('../../../core')

const service = app.services.user
const serializer = app.serializers.v1.user

function list(req, res, next) {
  const params = _.pick(req.query, 'limit', 'offset', 'sort')
  return service
    .list(params)
    .then(data => data.map(u => serializer(u)))
    .then(data => res.status(200).json(data))
    .catch(next)
}

module.exports = list
