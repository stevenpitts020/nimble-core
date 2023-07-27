const app = require('../../core')
const InternalServerError = require('../../errors/internal_server')
const logger = app.logger.getLogger('app.services.contract.fetch')

async function fetch(id) {
  logger.info(`[fetch] called for account request id [${id}]`)
  let accountRequest = await app.services.accountRequest.get(id)

  try {
    const result = await app.plugins.docusign.getCombinedPDFById(accountRequest.contractDocumentEnvelopeId)
    logger.info(`[fetch] finished for account request id [${id}]`)
    return result
  } catch (err) {
    logger.error(err, `[fetch] error fetching pdf from docusign for account request id [${id}]`)
    throw new InternalServerError('could not fetch PDF file for download')
  }
}

module.exports = fetch
