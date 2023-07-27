const app = require('../../core')
const logger = app.logger.getLogger('app.services.document.location')

async function location(id) {
  logger.debug(`[location] starting for id ${id}`)
  const document = await app.services.document.get({ id })
  return await app.plugins.aws.s3PresignedUrl(document.key)
}

module.exports = location
