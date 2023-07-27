const app = require('../../core')
const moment = require('moment')
const validator = app.plugins.validator
const ForbiddenError = require('../../errors/forbidden')
const PreconditionFailedError = require('../../errors/precondition_failed')
const ConflictError = require('../../errors/conflict')

const SignerEmailVerification = app.repositories.signerEmailVerification
const SignerEmailVerificationModel = app.models.signerEmailVerification
const logger = app.logger.getLogger('app.services.email_verification.update')

async function update(id, signerId, tx = app.db) {
  logger.debug('[update] started for id %s and signerId %s', id, signerId)
  await validator({ id, signerId }, SignerEmailVerificationModel.schema('update'), { abortEarly: false })

  // Check if signer exists
  await app.services.signer.get(signerId, tx)
  // Get email verification id
  const emailVerification = await app.services.emailVerification.get(id, tx)

  // validate preconditions
  if (signerId !== emailVerification.signerId) {
    throw new ForbiddenError('Email Verification is now allow for the signer')
  }
  if (emailVerification.consumedAt) {
    throw new ConflictError('Email Verification Token has already been consumed')
  }
  if (moment().isAfter(emailVerification.expiresAt)) {
    throw new PreconditionFailedError('Email Verification Token has expired')
  }

  // Update Signer Email Verification
  await SignerEmailVerification.forge({id}).save(
    { consumedAt: moment() },
    { method: 'update', transacting: tx }
  )

  // Update Signer verification Status
  await app.services.signer.update({
    id: signerId,
    emailVerified: true,
    emailVerifiedAt: new Date()
  }, tx)

  return emailVerification
}

module.exports = update
