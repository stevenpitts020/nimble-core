const app = require('../../../core')

const service = app.services.accountRequest
const serializer = app.serializers.v1.accountRequest

async function create(req, res) {
  const data = await service.create(req.body)
  const token = app.services.token.get({
    scopes: ['account_requests'],
    resources: [`account_requests#${data.id}`],
    expiration: 86400 // 24 hours
  })

  res
    .status(201)
    .set('x-nimble-token', token)
    .json(serializer(data))
}

module.exports = create
