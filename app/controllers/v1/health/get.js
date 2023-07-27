const _ = require('lodash')
const app = require('../../../core')
const svc = app.services.health

module.exports = (req, res, next) => svc.get()
  .then(health => res
    .status(_.get(health, 'code', 500))
    .json(health || { code: 500, status: 'Internal Server Error', message: 'Unavailable' }))
  .catch(next)
