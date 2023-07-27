const app = require('../../../core')

const notifications = app.services.notification

module.exports = (req, res, next) => notifications.create(req.body)
  .then(notification => res.status(204).json(notification))
  .catch(next)
