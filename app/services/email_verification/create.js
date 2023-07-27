const app = require('../../core')
const moment = require('moment')
const validator = app.plugins.validator

const SignerEmailVerification = app.repositories.signerEmailVerification
const SignerEmailVerificationModel = app.models.signerEmailVerification
const logger = app.logger.getLogger('app.services.email_verification.create')

async function create(signerId, tx = app.db) {
  logger.debug('[create] started for signer with id [%s]', signerId)
  await validator({ signerId }, SignerEmailVerificationModel.schema('create'), { abortEarly: false })

  // Check if signer exists
  await app.services.signer.get(signerId, tx)
  // Insert new record
  const newEmailVerification = await SignerEmailVerification.forge().save({
    signerId,
    expiresAt: moment().add(1, 'days'),
    consumedAt: null
  }, { method: 'insert', transacting: tx })

  // Update Signer verification Status
  await app.services.signer.update({
    id: signerId,
    emailVerified: false,
    emailVerifiedAt: null
  }, tx)

  // Send email
  await app.services.email.emailVerification(newEmailVerification.id, tx)

  return app.services.emailVerification.get(newEmailVerification.id, tx)
}

module.exports = create
