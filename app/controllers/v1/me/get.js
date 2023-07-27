const app = require('../../../core')
const service = app.services.user
const serializer = app.serializers.v1.me

function me(req, res, next) {
  return service
    .get(req.user.id)
    .then(data => {
      return serializer(data, true)})
    .then(data => res.json(data))
    .catch(next)
}

module.exports = me
