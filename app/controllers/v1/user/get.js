const _ = require('lodash')
const app = require('../../../core')
const service = app.services.user
const serializer = app.serializers.v1.user

function get(req, res, next) {
  const institutionId = _.get(req, 'user.institution.id')
  return service.get(req.params.id, null, institutionId)
    .then(serializer)
    .then(data => res.json(data))
    .catch(err => next(err))
}

module.exports = get
