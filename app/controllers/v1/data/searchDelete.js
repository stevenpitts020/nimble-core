const _ = require('lodash')
const app = require('../../../core')
const BadRequestError = require('../../../errors/bad_request')
const service = app.services.data

async function searchDelete(req, res) {
  const id = _.get(req, ['params', 'id'])

  if (!id) throw new BadRequestError('id required')

  const data = { ...req.body, id, createdById: req.user.id }

  try {
    const example = await service.searchDelete(data)
    res.status(200).json(example)
  } catch(err) {
    res.status(err.status || 500).json({ err: err.message })
  }
}

module.exports = searchDelete