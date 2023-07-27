const app = require('../../../core')

const service = app.services.auth
const serializer = app.serializers.v1.token

function login(req, res, next) {
  return service.login(req.body, 'local')
    .then(serializer)
    .then((data) => res.status(200).json(data))
    .catch((err) => next(err))
}

module.exports = login
