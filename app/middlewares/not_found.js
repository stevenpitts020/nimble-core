const NotFound = require('../errors/not_found')

function notFound(req, res, next) {
  next(new NotFound())
}

module.exports = function notFoundMiddleware() {
  return notFound
}
