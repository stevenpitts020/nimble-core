const app = require('../../../core')

const service = app.services.signer
const serializer = app.serializers.v1.signer
const model = app.models.signer
const validator = app.plugins.validator

async function update(req, res) {
  const schema = model.schema('update.api.public')
  const payload = validator({ ...req.body, id: req.params.id }, schema, { abortEarly: false })
  const data = model.flattenData(payload)

  const signer = await service.update(data)
  res.json(serializer(signer))
}

module.exports = update
