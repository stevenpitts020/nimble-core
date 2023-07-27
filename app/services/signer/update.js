const _ = require('lodash')
const app = require('../../core')
const validateDocuments = require('./helpers/validate_documents')
const validateService = require('./validate')
const Signer = app.repositories.signer
const SignerModel = app.models.signer
const PreconditionFailedError = require('../../errors/precondition_failed')
const ConflictError = require("../../errors/conflict")
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.signer.update')

function validate(payload) {
  return validator(payload, SignerModel.schema('update'), { abortEarly: false })
}

function validateAccountRequestStatus(status) {
  if (status !== 'DRAFT' && status !== 'INCOMPLETE') {
    // we can only allow updates if the account request is still open (not signed, not pending review, not approved, etc)
    throw new PreconditionFailedError('Account status is not correct.')
  }
}

async function validateAndUpdateSignerStatus(signerId, tx = app.db) {
  logger.debug(`[validateAndUpdateSignerStatus] - started for signer [${signerId}]`)

  const signer = await app.services.signer.get(signerId, tx)
  if (signer.status === 'SIGNED') { // status is SIGNER, we cant allow further changes on this signer personal data
    throw new PreconditionFailedError('Signer status is not correct.')
  }

  const status = SignerModel.getSignerStatusBasedOnCompletedProps(signer)
  logger.debug(`[validateAndUpdateSignerStatus] - status should be [${status}] for signer [${signerId}]`)

  if (status !== signer.status) { // only update if changing
    logger.debug(`[validateAndUpdateSignerStatus] - changing status to [${status}] for signer [${signerId}]`)
    await updateSigner(signer.id, { status }, tx)
  }

  logger.debug(`[validateAndUpdateSignerStatus] - end for signer [${signerId}]`)
}

async function updateSigner(id, data, tx = app.db) {
  const updateData = {
    id: id,
    ...data
  }

  // Check for duplicates
  const results = await validateService(updateData, tx)
  if (results) {
    // dupes exist - prevent update
    throw new ConflictError('Duplicates values for fields which must be unique exist between multiple signers on the application')
  }

  await Signer.forge({ id: id }).save(updateData, {
    method: 'update',
    transacting: tx
  })
}

async function updateAccountRequestStatus(accountRequestId, tx = app.db) {
  const accountRequest = await app.services.accountRequest.get(accountRequestId, tx)
  // check if there are signers who have not onboarded
  const invitedSigners = accountRequest.signers.filter(signer => signer.status === 'INVITED' || signer.status === 'INCOMPLETE')
  if (invitedSigners.length > 0) {
    return
  }

  if (accountRequest.status !== 'INCOMPLETE') {
    return
  }

  // update status to pending if all signers onboarded
  return app.services.accountRequest.update({ id: accountRequest.id, status: 'PENDING' }, null, tx)
}

// TODO: move to global Model object as helper
function intentsToModify(before, after, params = []) {
  if (params.find((param) => _.has(after, param))) {
    for (let item of params) {
      if (_.get(after, item, null) !== _.get(before, item, null)) {
        return true
      }
    }
  }

  return false
}


async function update(payload, tx = app.db) {
  let triggerUpdateEvent = false
  let data = await validate(payload)
  logger.debug(`[update] - started for signer [${data.id}]`)

  // load models
  const signer = await app.services.signer.get(data.id, tx)
  const accountRequest = await app.services.accountRequest.get(signer.accountRequestId, tx)

  /** NOTE:
   * we use _.pick() to only update parameters we are feeding this function
   * or else JOI defaults will also be updated and we don't want that
   */
  const signerData = _.pick(data, Object.keys(payload))

  // check if the signer documents are ok
  await validateDocuments(signerData, tx)

  // update signer
  await updateSigner(signer.id, signerData, tx)

  // run post update checks
  // thrown Exceptions here will rollback the update
  if (intentsToModify(signer, signerData, SignerModel.completeStatusProps())) {
    triggerUpdateEvent = true

    // check if the account request can be updated
    validateAccountRequestStatus(accountRequest.status)

    // check if all data is OK, and update the status
    await validateAndUpdateSignerStatus(signer.id, tx)

    // update contract in docusign with new signer information
    try {
      await app.services.contract.update(signer.id, tx)
    } catch (err) {
      logger.debug(`[update] - could not execute app.services.contract.update for [${signer.id}]`)
    }

  }

  if (intentsToModify(signer, signerData, ['email'])) {
    // trigger email verification
    await app.services.emailVerification.create(signer.id, tx)
  }


  // update account request status
  await updateAccountRequestStatus(accountRequest.id, tx)

  if (triggerUpdateEvent) { // only trigger event, if personal data changed
    await app.services.eventStream.publish({
      topicArn: app.config.get('sns').topicSigner,
      id: signer.id,
      event: app.services.eventStream.events.signerUpdated
    })
  }

  logger.debug(`[update] - finished for signer [${signer.id}]`)
  return await app.services.signer.get(signer.id, tx)
}

module.exports = update
