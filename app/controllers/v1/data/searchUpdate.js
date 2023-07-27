const _ = require('lodash')
const app = require('../../../core')
const BadRequestError = require('../../../errors/bad_request')
const service = app.services.data

async function searchCreate(req, res) {
  if (_.isEmpty(req.body)) throw new BadRequestError('body required')

  const id = _.get(req, ['params', 'id'])

  if (!id) throw new BadRequestError('id required')

  const data = { ...req.body, id, institutionId: req.user.institutionId }

  try {
    const search = await service.searchSave(data)
    res.status(200).json(search)
  } catch(err) {
    res.status(err.status || 500).json({ err: err.message })
  }
}

module.exports = searchCreate