const _ = require('lodash')
const app = require('../../core')
const PreconditionFailed = require('../../errors/precondition_failed')

const AccountRequest = app.repositories.accountRequest
const logger = app.logger.getLogger('app.services.contract.update')


function getProductName(productConfigurations) {
  // for now we only have 1 product
  if (productConfigurations.length > 0) {
    return productConfigurations[0].product.name
  }
  return 'Missing Product Name'
}

function getInitialDeposit(productConfigurations) {
  // for now we only have 1 product
  if (productConfigurations.length > 0) {
    return productConfigurations[0].initialDeposit
  }
  return 0
}

function getExtraOptions(accountRequest, institution) {
  const extraOptions = {
    institutionName: institution.name,
    productName: getProductName(accountRequest.productConfigurations),
    openingAmount: getInitialDeposit(accountRequest.productConfigurations),
    productConfigurations: accountRequest.productConfigurations,
  }
  return extraOptions
}
/**
 * Update Contract information for a signer
 * @param {uuid} signerId - Signer UUID
 * @param {app.db} tx
 */
async function update(signerId, tx = app.db) {
  logger.info(`[update] called for signer id [${signerId}]`)

  const signer = await app.services.signer.get(signerId, tx)
  const accountRequest = await app.services.accountRequest.get(signer.accountRequestId, tx)
  const institution = await app.services.institution.get({ id: accountRequest.institutionId }, tx)
  // get templates from database
  const docusignTemplateIds = await app.services.docusignTemplate.fetch({ institutionId: accountRequest.institutionId, version: 1 }, tx)


  if (_.isEmpty(accountRequest.contractDocumentEnvelopeId)) {
    logger.info(`[update] error - missing contractDocumentEnvelopeId for signer id [${signerId}]`)
    throw new PreconditionFailed('We are missing contractDocumentEnvelopeId')
  }

  // we could simplify this but the main goal is to have the primary FIRST
  const primarySigner = accountRequest.signers.find(s => s.role === 'PRIMARY')
  const otherSigners = accountRequest.signers.filter(s => s.role === 'SECONDARY')

  let data
  try {
    data = {
      accountRequestId: accountRequest.id,
      signers: [primarySigner, ...otherSigners],
      accountOptions: getExtraOptions(accountRequest, institution)
    }
    // set docusign templates
    app.plugins.docusign.setDocusignTemplates(docusignTemplateIds)

    logger.debug(`[update] updating envelope for signer id [${signer.id}]`)
    await app.plugins.docusign.updateEnvelopeRecipients(data, accountRequest.contractDocumentEnvelopeId, signer.id)

    await tx.transaction(async tx => {
      // save account request
      await AccountRequest
        .forge({ id: accountRequest.id })
        .save({
          contractDocumentEnvelopeStatus: 'UPDATED',
          contractDocumentEnvelopeStatusUpdatedAt: new Date(),
        }, { transacting: tx, patch: true })

      logger.debug(`[update] contract data saved on account request id [${accountRequest.id}]`)
      return true
    })

  } catch (err) {
    logger.info(err, `[update] error for account request id [${accountRequest.id}]`)
    throw new PreconditionFailed('We could not update the document with Docusign. Please contact support.')
  }

  return true
}

module.exports = update
