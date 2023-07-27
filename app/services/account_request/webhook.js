const _ = require('lodash')
const app = require('../../core')

const validator = app.plugins.validator
const AccountRequestModel = app.models.accountRequest
const AccountRequest = app.repositories.accountRequest
const Signer = app.repositories.signer
const logger = app.logger.getLogger('app.services.account_request.webhook')

const UnauthorizedTokenError = require('../../errors/unauthorized_token')

async function validate(params) {
  return validator(params, AccountRequestModel.schema('webhook'), { abortEarly: false })
}


function patchAccountRequest(id, status, tx = app.db) {
  return AccountRequest.forge({ id }).save({
    contractDocumentEnvelopeStatus: status.toUpperCase(),
    contractDocumentEnvelopeStatusUpdatedAt: new Date()
  }, {
    transacting: tx,
    method: 'update',
    patch: true
  })
}

function patchSigner(signer, accountRequestId, status, tx = app.db) {
  let updatedData = {
    id: signer.id,
    contractDocumentSignerStatus: status.toUpperCase(),
    contractDocumentSignerStatusUpdatedAt: new Date()
  }

  if (status.toUpperCase() === 'COMPLETED') {
    updatedData.status = 'SIGNED'
  }

  return Signer.where({
    id: signer.id,
    email: signer.email,
    account_request_id: accountRequestId,
  }).save(updatedData, {
    transacting: tx,
    method: 'update',
    patch: true
  })
}

async function uploadContract(accountRequestId, transacting = app.db) {
  try {
    logger.info(`[uploadContract] start for account request [${accountRequestId}]`)
    const accountRequest = await app.services.accountRequest.get(accountRequestId, transacting)

    logger.info(`[uploadContract] downloading contract for account request [${accountRequestId}]`)
    const pdf = await app.services.contract.fetch(accountRequest.id, transacting)

    logger.info(`[uploadContract] contract downloaded successfully [${accountRequestId}]`)
    const document = await app.services.document.create({
      format: 'pdf',
      content: Buffer.from(pdf, 'binary').toString('base64'),
      institutionId: accountRequest.institutionId
    })

    logger.info(`[uploadContract] created document for [${accountRequestId}] with [${document.id}]`)
    await AccountRequest.forge({ id: accountRequestId }).save({ contractDocumentId: document.id }, { patch: true, method: 'update' })

  } catch (err) {
    logger.error(err, `[uploadContract] error trying to upload contract for account request [${accountRequestId}]`)
  }
}

async function webhook(id, token) {
  await validate({ id, token })
  try {
    let key = app.plugins.jwt.decode(token)
    if (key.id != id) {
      throw new Error()
    }
  } catch (err) {
    logger.error(err, `[webhook] error accessing webhook, token is not valid [${token}]`)
    throw new UnauthorizedTokenError()
  }

  let accountRequest = await app.services.accountRequest.get(id)
  logger.info(`[webhook] started for account request [${id}]`)

  try {
    let envelope = await app.plugins.docusign.getEnvelopeById(accountRequest.contractDocumentEnvelopeId)
    let status = envelope.status.toUpperCase()
    let signers = _.get(envelope, 'recipients.signers', [])

    return await app.db.transaction(async tx => {
      // status changed
      if (accountRequest.contractDocumentEnvelopeStatus != status) {
        logger.info(`[webhook] updating account request [${id}] from ${accountRequest.contractDocumentEnvelopeStatus} to ${status}`)
        await patchAccountRequest(id, status, tx)
      }

      // signer changes
      for (let remoteSigner of signers) {
        let dbSigner = accountRequest.signers.find(s => s.id === remoteSigner.clientUserId)
        if (dbSigner && _.get(dbSigner, 'contractDocumentSignerStatus', '') !== remoteSigner.status.toUpperCase()) {
          logger.info(`[webhook] updating signer [${dbSigner.id}] from contract status ${dbSigner.contractDocumentSignerStatus} to ${remoteSigner.status}`)
          await patchSigner(dbSigner, id, remoteSigner.status, tx)
        }
      }

      // everyone has signed
      if (status === 'COMPLETED') {
        logger.info(`[webhook] document is COMPLETED, updating account request [${id}] to 'SIGNED'`)
        await app.services.accountRequest.update({ id: id, status: 'SIGNED' }, null, tx)
      }

      uploadContract(accountRequest.id)

      logger.info(`[webhook] ended for account request [${id}]`)
      return true
    })

  } catch (err) {
    logger.error(err, `[webhook] error updating docusign data for account request [${id}]`)
    throw new Error('Error while processing webhook from docusign.')
  }
}

module.exports = webhook
