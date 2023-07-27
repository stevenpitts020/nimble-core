const _ = require('lodash')
const app = require('../../core')
const validateDocuments = require('./helpers/validate_documents')
const Signer = app.repositories.signer
const SignerModel = app.models.signer
const validator = app.plugins.validator
const PreconditionFailedError = require('../../errors/precondition_failed')
const logger = new app.logger.getLogger('app.services.signer.create')

async function validate(payload) {
  const data = _.pick(payload, SignerModel.props())
  return validator(data, SignerModel.schema('create'), { abortEarly: false })
}

function validatePreconditions(signer, accountRequest) {
  // Validate account request status
  if (accountRequest.status !== 'DRAFT') {
    throw new PreconditionFailedError('Can only add new signers to DRAFT account request')
  }
  // can only have 1 primary signer
  if (signer.role === 'PRIMARY' && accountRequest.signers.find(s => s.role === 'PRIMARY')) {
    throw new PreconditionFailedError('Account request can only have one PRIMARY signer')
  }
  // must create primary before secondary singers
  if (signer.role === 'SECONDARY' && accountRequest.signers.length === 0) {
    throw new PreconditionFailedError('First signer added should be PRIMARY')
  }
  // can only have 4 signers
  if (accountRequest.signers.length >= 4) {
    throw new PreconditionFailedError('Account request has reached maximum number of signers')
  }
}

async function create(params, tx = app.db) {
  logger.debug(`[create] started for signer with email [${params.email}]`)
  const paramsData = await validate(params)

  const accountRequest = await app.services.accountRequest.get(params.accountRequestId, tx)

  validatePreconditions(paramsData, accountRequest)

  const signerId = await tx.transaction(async tx => {
    /** NOTE:
     * we use _.pick() to only update parameters we are feeding this function
     * or else JOI defaults will also be updated and we don't want that
     */
    const data = _.pick(paramsData, Object.keys(params))

    // check if the signer documents are ok
    await validateDocuments(data, tx)

    const newSignerStatus = SignerModel.getSignerStatusBasedOnCompletedProps(data)
    const newSignerData = {
      ...data,
      status: newSignerStatus,
      consent: !!data.consent,
      consentAccountOpening: !!data.consentAccountOpening,
      consentPrivacyPolicy: !!data.consentPrivacyPolicy,
      consentCommunication: !!data.consentCommunication,
      institutionId: accountRequest.institutionId
    }

    const model = await Signer.forge(newSignerData).save(null, {
      method: 'insert',
      transacting: tx
    })

    return model.get('id')
  })

  // re-fetch signer
  const newSigner = await app.services.signer.get(signerId, tx)

  if (accountRequest.signers.length === 0) {
    // if this is the first signer being created, we assume its the creator of the account request
    await app.services.accountRequest.update({
      id: accountRequest.id,
      createdById: signerId
    })

  }

  // if the newly created signer has all required data:
  if (newSigner.status === 'PENDING') {
    try {
      // send email verification
      await app.services.emailVerification.create(signerId, tx)
    } catch (err) {
      logger.error(err, `[create] error while creating "services.emailVerification" for id ${signerId}`)
    }

    // trigger event
    await app.services.eventStream.publish({
      topicArn: app.config.get('sns').topicSigner,
      id: signerId,
      event: app.services.eventStream.events.signerCreated
    })
    logger.info(`[create] publish to event stream for signer [${params.email}] with id [${signerId}]`)
  } else { // if signer is still missing some data
    try {
      // send invite via email
      await app.services.email.inviteSigner(signerId, tx)
    } catch (err) {
      logger.error(err, `[create] error while sending "services.email.inviteSigner" for id ${signerId}`)
    }
  }

  return app.services.signer.get(signerId, tx)
}

module.exports = create
