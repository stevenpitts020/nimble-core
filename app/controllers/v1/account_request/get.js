const app = require('../../../core')
const service = app.services.accountRequest
const serializer = app.serializers.v1.accountRequest

function get(req, res, next) {
  return service
    .get(req.params.id)
    .then(data => serializer(data))
    .then(data => res.json(data))
    .catch(next)
}

module.exports = get
