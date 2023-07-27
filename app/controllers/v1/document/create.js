const _ = require('lodash')
const app = require('../../../core')
const service = app.services.document
const serializer = app.serializers.v1.document

async function create(req, res) {
  const payload = _.pick(req.body, 'content', 'format', 'institutionId')
  const data = await service.create(payload)
  res.status(201).json(serializer(data))
}

module.exports = create
