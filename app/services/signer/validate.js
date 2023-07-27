const app = require('../../core')
const SignerModel = app.models.signer
const validateSigners = require("../account_request/helpers/validate_signers")
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.signer.validate')

function validatePayload(payload) {
  return validator(payload, SignerModel.schema('validate.api.public'), { abortEarly: false })
}

async function validate(payload, tx = app.db) {
  logger.debug(`[validate] - started for signer [${payload.id}]`)

  // The accountRequestId is necessary in order to perform validation across all signers.  If it has not already
  // been specified, we will look it up
  if (!payload.accountRequestId) {
    const signer = await app.services.signer.get(payload.id, tx)
    payload.accountRequestId = signer.accountRequestId
  }

  const signerData = await validatePayload(payload)

  const accountRequest = await app.services.accountRequest.get(signerData.accountRequestId, tx)

  const dupes = await validateSigners(accountRequest, signerData)

  logger.debug(`[validate] - finished for signer [${signerData.id}]`)
  return dupes
}

module.exports = validate
