const app = require('../../../core')
const requestIp = require('request-ip')

const service = app.services.signer
const serializer = app.serializers.v1.signer
const model = app.models.signer
const validator = app.plugins.validator

async function create(req, res) {
  const schema = model.schema('create.api.public')
  const payload = validator(req.body, schema, { abortEarly: false })
  const data = {
    ...model.flattenData(payload),
    remoteMetadata: {
      userAgent: req.get('user-agent'),
      cookie: req.get('cookie'),
      hostname: req.hostname,
      host: req.get('x-forwarded-host') || req.get('host'),
      ip: requestIp.getClientIp(req),
      ips: req.ips
    }
  }

  const signer = await service.create(data)
  const token = app.services.token.get({
    scopes: ['signers'],
    resources: [`signers#${signer.id}`],
    expiration: 86400 // 24 hours
  })

  res.status(201)
    .set('x-nimble-token', token)
    .json(serializer(signer))
}

module.exports = create
