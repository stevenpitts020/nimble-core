const _ = require('lodash')
const app = require('../../../core')
const service = app.services.data

async function profile(req, res) {
  if (_.isEmpty(req.query)) return res.status(400).json({ error: '? required' })

  const profile = await service.profile(req.query)
  res.status(200).json(profile)
}

module.exports = profile