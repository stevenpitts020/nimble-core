const app = require('../../../core')

const service = app.services.product
const serializer = app.serializers.v1.product

async function create(req, res) {
  const institutionId = req.params.id
  const data = await service.create({ ...req.body, institutionId })
  res.status(201).json(serializer(data))
}

module.exports = create
