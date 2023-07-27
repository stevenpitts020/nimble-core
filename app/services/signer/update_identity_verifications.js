const app = require('../../core')
const Joi = require('@hapi/joi')
const _ = require('lodash')

const Signer = app.repositories.signer
const logger = app.logger.getLogger('app.services.signer.update_identity_verification')

const { validator } = app.plugins
const entrySchema = Joi.object().keys({
  signerId: Joi.string().uuid().required(),
  verificationItems: Joi.array().required().items(
    Joi.object().keys({
      verification: Joi.string().required(),
      status: Joi.string().required()
    })
  ).default([])
})


async function updateIdentityVerifications(payload, tx = app.db) {
  const data = _.pick(payload, ['signerId', 'verificationItems'])
  logger.debug(`[updateIdentityVerifications] started for signer [${data.signerId}]`)
  validator(data, entrySchema, { abortEarly: false })

  // check if signer exists
  await app.services.signer.get(data.signerId, tx)

  // config the group checks per key.
  const verificationGroups = {
    verificationStatusFace: ['face_detection', 'face_on_document_matched'],
    verificationStatusDocument: ['originality', 'visibility', 'document_type', 'issued_date', 'expiration_date', 'name', 'country'],
    verificationStatusAddress: ['address'],
  }

  // create an internal fn() that parses checks for each key
  const verificationGroupsCheck = (key) => {
    // filter per check inside each key
    let checks = verificationGroups[key].map(check => payload.verificationItems.find(vI => _.get(vI, 'verification') === check))

    // any pending? its all pending
    if (checks.find(vI => _.get(vI, 'status') === 'PENDING')) {
      return 'PENDING'
    }

    // any invalid? its all invalid
    if (checks.find(vI => _.get(vI, 'status') === 'INVALID')) {
      return 'INVALID'
    }

    // the number of VALID must match the number of EXPECTED valids
    if (checks.filter(vI => _.get(vI, 'status') === 'VALID').length === verificationGroups[key].length) {
      return 'VALID'
    }

    // or else/nothing found.
    return 'PENDING'
  }

  const signerIdentityVerificationChecks = {
    'verificationStatusFace': verificationGroupsCheck('verificationStatusFace'),
    'verificationStatusFaceUpdatedAt': new Date(),
    'verificationStatusDocument': verificationGroupsCheck('verificationStatusDocument'),
    'verificationStatusDocumentUpdatedAt': new Date(),
    'verificationStatusAddress': verificationGroupsCheck('verificationStatusAddress'),
    'verificationStatusAddressUpdatedAt': new Date(),
  }

  // SAVE all signerIdentityVerificationChecks fields into signer
  await Signer.forge({ id: data.signerId }).save(signerIdentityVerificationChecks, {
    method: 'update',
    transacting: tx
  })

  return data.signerId
}

module.exports = updateIdentityVerifications
