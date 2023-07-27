const _ = require('lodash')
const app = require('../../../core')

const service = app.services.auth
const serializer = app.serializers.v1.token

function login_one_time_token(req, res, next) {
  service.loginOneTimeToken(_.merge(req.body, { email: req.params.email }))
    .then(serializer)
    .then(data => res.status(200).json(data))
    .catch(next)
}

module.exports = login_one_time_token
