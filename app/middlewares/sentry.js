const Sentry = require('@sentry/node')
const app = require('../core')
const _ = require('lodash')

// Add Sentry if we have a dsn key
const INIT_SENTRY = (app.config.get('env') === 'prod' || app.config.get('env') === 'staging') && !_.isEmpty(app.config.get('sentry.dsn'))

if (INIT_SENTRY) {
  Sentry.init({
    dsn: app.config.get('sentry.dsn'),
    environment: app.config.get('env')
  })
}

module.exports = {
  requestHandler: function() {
    return !INIT_SENTRY ? null : Sentry.Handlers.requestHandler()
  },
  errorHandler: function() {
    return !INIT_SENTRY ? null : Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Capture all except this whitelist
        var whitelist = [404, 403, 401, 412, 400]

        return !whitelist.includes(error.statusCode)
      }
    })
  }
}
