const app = require('../../core')

const SignerIdentityVerification = app.repositories.signerIdentityVerification
const SignerIdentityVerificationModel = app.models.signerIdentityVerification
const { validator } = app.plugins
const logger = app.logger.getLogger('app.services.identity_verification.create')

async function create(payload, tx = app.db) {
  logger.debug(payload, '[create] started with payload')
  const data = validator(payload, SignerIdentityVerificationModel.schema('create'), { abortEarly: false })

  const { id } = await SignerIdentityVerification.forge(data).save(null, { method: 'insert', transacting: tx })

  return id
}

module.exports = create
