const app = require('../../../core')

const service = app.services.bsaRiskResult
const serializer = app.serializers.v1.bsaRiskResult

async function create(req, res) {
  const accountRequestId = req.params.id
  const data = await service.create(req.body, accountRequestId)
  res.status(201).json(data.map(serializer))
}

module.exports = create
