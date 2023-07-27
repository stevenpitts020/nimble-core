const _ = require('lodash')
const app = require('../../../core')
const User = app.models.user
const service = app.services.accountRequest
const serializer = app.serializers.v1.accountRequest
const model = app.models.accountRequest
const validator = app.plugins.validator

function patch(req, res, next) {
  const patch = validator({ ...req.body, id: req.params.id }, model.schema('patch.api.public'), { abortEarly: false })

  // If the requester is not, at least, a branch admin, do not allow updates to soft-delete
  // FIXME: route acl should have managed the institution membership, however it should be checked here
  if (_.isBoolean(patch.deleted) && !User.isBranchAdmin(req.user)) delete patch['deleted']

  return service
    .patch(patch)
    .then(data => serializer(data))
    .then(data => res.json(data))
    .catch(next)
}

module.exports = patch
