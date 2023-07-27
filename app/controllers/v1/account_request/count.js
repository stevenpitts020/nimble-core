const _ = require('lodash')
const app = require('../../../core')
const service = app.services.accountRequest
const serializer = app.serializers.v1.count

function count(req, res, next) {
  const params = {
    ..._.pick(req.query, 'status'),
    institutionId: req.user.institutionId,
  }

  return service
    .count(params)
    .then(serializer)
    .then(data => res.status(200).json(data))
    .catch(next)
}

module.exports = count
