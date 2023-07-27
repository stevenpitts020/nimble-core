const app = require('../../core')
const _ = require('lodash')
const validator = app.plugins.validator
const SignerModel = app.models.signer
const UnauthorizedError = require('../../errors/unauthorized')
const logger = app.logger.getLogger('app.services.identity.webhook')


function validate(payload) {
  return validator(payload, SignerModel.schema('webhook'), { abortEarly: false })
}

async function webhook(payload, tx = app.db) {
  logger.info(`[webhook] running identity webhook for signer [${_.get(payload, 'reference')}] got event [${_.get(payload, 'event', '')}]`)

  const data = validate(payload)
  let signer
  try {
    signer = await app.services.signer.get(data.reference, tx)
  } catch (err) {
    logger.info(err, `[webhook] error for signer [${_.get(payload, 'reference')}] and event [${_.get(payload, 'event', '')}]`)
    throw new UnauthorizedError(err)
  }

  // only try to update verification status if the event brings a result
  if (_.has(payload, 'verification_result')) {
    const verification_items = app.services.identity.parse(data.event, payload.verification_result)
    logger.info(verification_items, '[webhook] parsed the data with [app.services.identity.parse]')

    for (const item of verification_items) {
      await app.services.identityVerification.create({ signerId: signer.id, ...item }, tx)
    }

    // save verification checks in signer
    await app.services.signer.updateIdentityVerifications({ signerId: signer.id, verificationItems: verification_items }, tx)
    logger.info(`[webhook] saved the data with [app.services.signer.updateIdentityVerifications] for signer id [${signer.id}]`)
  }

  logger.info('[webhook] finished')
  return "OK"
}

module.exports = webhook
