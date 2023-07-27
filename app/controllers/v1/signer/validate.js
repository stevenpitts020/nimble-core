const app = require('../../../core')

const service = app.services.signer
const model = app.models.signer
const validator = app.plugins.validator

async function validate(req, res) {
  const schema = model.schema('validate.api.public')
  const payload = validator({ ...req.body, id: req.params.id }, schema, { abortEarly: false })
  const data = model.flattenData(payload)

  const results = await service.validate(data)
  if (results) {
    res.status(409)
  }
  res.json(results)
}

module.exports = validate
