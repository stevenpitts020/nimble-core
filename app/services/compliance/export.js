const PreconditionFailedError = require('../../errors/precondition_failed')
const app = require('../../core')
const logger = app.logger.getLogger('app.services.compliance.export')

async function __export(searchId, institutionId) {
  logger.debug(`[__export] started for search id [${searchId}] and institution id [${institutionId}]`)
  try {
    const query = await app.repositories.complyAdvantage.getCertificate(searchId)
    if (!(query.data instanceof Buffer)) {
      throw new Error('__export() Could not fetch certificate')
    }

    return await app.services.document.create({
      format: 'pdf',
      content: query.data.toString('base64'),
      institutionId: institutionId
    }, {
      ContentType: 'application/pdf'
    })

  } catch (err) {
    logger.info(err, `[__export] failed for search id [${searchId}] and institution id [${institutionId}]`)
    throw new PreconditionFailedError(err)
  }
}

module.exports = __export
