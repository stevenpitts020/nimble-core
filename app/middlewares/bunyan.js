const bunyanMiddlewareFn = require('bunyan-middleware')
const app = require('../core')

module.exports = function bunyanMiddleware() {
  return bunyanMiddlewareFn({
    logger: app.logger.getLogger('app.middleware.bunyan'),
    filter: (req) => {
      return req.url.match(/v1\/health/gi)
    }
  })
}
