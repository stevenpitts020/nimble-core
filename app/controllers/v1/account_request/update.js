const app = require('../../../core')
const _ = require('lodash')
const service = app.services.accountRequest
const serializer = app.serializers.v1.accountRequest
const model = app.models.accountRequest
const validator = app.plugins.validator


function update(req, res, next) {
  const userId = _.get(req, 'user.id', null)
  const schema = userId ? model.schema('update.api.private') : model.schema('update.api.public')

  const payload = validator({ ...req.body, id: req.params.id }, schema, { abortEarly: false })
  return service
    .update(payload, userId)
    .then(data => serializer(data))
    .then(data => res.json(data))
    .catch(next)
}

module.exports = update
