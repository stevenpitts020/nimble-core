const _ = require('lodash')
const app = require('../../../core')

const service = app.services.institution
const serializer = app.serializers.v1.institution

function list(req, res, next) {
  const params = _.pick(req.query, 'limit', 'offset', 'sort', 'search')
  return service
    .list(params)
    .then(data => data.map(i => serializer(i)))
    .then(data => res.status(200).json(data))
    .catch(next)
}

module.exports = list
