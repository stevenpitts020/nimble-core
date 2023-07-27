const _ = require('lodash')
const app = require('../../../core')
const BadRequestError = require('../../../errors/bad_request')
const service = app.services.data

async function searchGet(req, res) {
  const id = _.get(req, ['params', 'id'])

  if (!id) throw new BadRequestError('id required')

  try {
    const search = await service.searchGet(id)
    res.status(200).json(search)
  } catch(err) {
    res.status(err.status || 500).json({ err: err.message })
  }
}

module.exports = searchGet