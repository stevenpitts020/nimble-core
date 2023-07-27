const app = require('../../core')
const InternalServerError = require('../../errors/internal_server')
const SignerContractModel = app.models.signerContract
const logger = app.logger.getLogger('app.services.contract.embed')

async function embed(signerId, tx = app.db) {
  logger.info(`[embed] called for signer id [${signerId}]`)

  // fetch required data
  const signer = await app.services.signer.get(signerId, tx)
  const accountRequest = await app.services.accountRequest.get(signer.accountRequestId, tx)
  const institution = await app.services.institution.get({ id: accountRequest.institutionId }, tx)

  try {
    // build URL using docusing
    const url = await app.plugins.docusign.createRecipientView(
      accountRequest.contractDocumentEnvelopeId,
      signer,
      institution.domain
    )


    logger.info(`[embed] finished for signer id [${signerId}]`)
    // return using internal model
    return new SignerContractModel({ url }).data()
  } catch (err) {
    logger.error(err, `[embed] error fetching embed url from docusign for signer id [${signerId}]`)
    throw new InternalServerError('Could not embed url from docusign')
  }
}

module.exports = embed
