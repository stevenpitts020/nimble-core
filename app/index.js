const fs = require('fs')

const app = require('./core')
const _ = require('lodash')
_.mixin(require('lodash-inflection'))
const swagger = require('./plugins/swagger')
const logger = app.logger.getLogger('app.index')

module.exports = async (listen = false) => {
  try {
    await app.load()
  } catch (err) {
    logger.error(err, '[index] could not boot app')
    return null
  }

  // The request handler must be the first middleware on the app
  app.middleware(app.middlewares.sentry.requestHandler)

  // middlewares are not autoloaded to keep loading order manual
  app.middleware(app.middlewares.cors)
  app.middleware(app.middlewares.bodyParser)
  app.middleware(app.middlewares.bunyan)

  app.middleware(app.middlewares.contentTypeSupport)

  // global response header access
  app.server.use((req, res, next) => {
    res.set('Access-Control-Expose-Headers', 'Cache-Control, Content-Language, Content-Length, Content-Type, Expires, Last-Modified, Pragma, x-nimble-token')
    next()
  })

  //routes need to be loaded after pre-middlewares
  await app.loadRoutes()

  // load swagger
  swagger(app)

  // this is the 404 Route
  app.route('/*', app.middlewares.notFound)

  // The error handler must be before any other error middleware and after all controllers
  app.middleware(app.middlewares.sentry.errorHandler)
  // load the normal error handler
  app.middleware(app.middlewares.errorHandler)

  // create upload dir
  const imageBasePath = app.config.get('image.basePath')
  fs.mkdir(imageBasePath, () => {
    logger.debug(`[index] creating img path ${imageBasePath}`)
  })

  if (!listen) return app // stop here if we are not setting sails
  return app.start()
}
