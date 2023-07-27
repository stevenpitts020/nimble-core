const _ = require('lodash')
const app = require('../../core')
const PreconditionFailed = require('../../errors/precondition_failed')

const AccountRequest = app.repositories.accountRequest
const logger = app.logger.getLogger('app.services.contract.send')

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


async function send(id, tx = app.db) {
  logger.info(`[send] called for account request id [${id}]`)
  const accountRequest = await app.services.accountRequest.get(id, tx)
  const institution = await app.services.institution.get({ id: accountRequest.institutionId }, tx)
  // get templates from database
  const docusignTemplateIds = await app.services.docusignTemplate.fetch({ institutionId: accountRequest.institutionId, version: 1 }, tx)

  if (accountRequest.signers.length === 0) {
    logger.info(`[send] error - no signers for account request id [${accountRequest.id}]`)
    throw new PreconditionFailed('No signers')
  }

  // we could simplify this but the main goal is to have the primary FIRST
  const primarySigner = accountRequest.signers.find(s => s.role === 'PRIMARY')
  const otherSigners = accountRequest.signers.filter(s => s.role === 'SECONDARY')

  const extraOptions = {
    institutionName: institution.name,
    productName: getProductName(accountRequest.productConfigurations),
    openingAmount: getInitialDeposit(accountRequest.productConfigurations),
    productConfigurations: accountRequest.productConfigurations,
  }

  try {
    logger.info(`[send] sending envelope for account request id [${accountRequest.id}]`)
    const data = {
      accountRequestId: accountRequest.id,
      signers: [primarySigner, ...otherSigners],
      accountOptions: extraOptions,
      // send a copy of the contract to the institution manager
      ccRecipient: {
        fullName: institution.name,
        email: institution.email,
      },
    }
    const docusign = app.plugins.docusign
    // set docusign templates
    docusign.setDocusignTemplates(docusignTemplateIds)

    const envelope = await app.plugins.docusign.sendEnvelopeWithMultipleDocuments(data)

    await tx.transaction(async tx => {
      // save account request
      await AccountRequest
        .forge({ id: accountRequest.id })
        .save({
          contractDocumentEnvelopeId: _.get(envelope, 'results.envelopeId', null),
          contractDocumentEnvelopeStatus: 'CREATED',
          contractDocumentCreatedAt: new Date(),
          contractDocumentEnvelopeStatusUpdatedAt: new Date(),
        }, { transacting: tx, patch: true })

      logger.info(`[send] contract data saved on account request id [${accountRequest.id}]`)

      return true
    })

  } catch (err) {
    logger.info(err, `[send] error for account request id [${accountRequest.id}]`)
    throw new PreconditionFailed('We could not send the document with Docusign. Please contact support.')
  }

  return true
}

module.exports = send
