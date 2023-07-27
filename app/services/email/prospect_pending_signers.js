const _ = require('lodash')
const Joi = require('@hapi/joi')
const app = require('../../core')
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.email.prospect_pending_signers')

const prospectPendingSignersSchema = Joi.object().keys({
  prospectFirstName: Joi.string().required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  statusEmailSubject: Joi.string().required(),
  accountType: Joi.string().required(),
  institution: Joi.string().required(),
  institutionUrl: Joi.string().required(),
})

const whitelist = ['id']
const entrySchema = Joi.object().keys({
  id: Joi.string().uuid().required(),
})

async function validate(params) {
  const data = _.pick(params, whitelist)
  validator(data, entrySchema, { abortEarly: false })
  return data
}

function emailSubject() {
  return `We just want to let you know that your account is pending`
}

async function prospectPendingSigners(id, tx = app.db) {
  logger.debug(`[prospectPendingSigners] starting for signer id ${id}`)
  const data = await validate({ id })

  // fetch the invitee
  const signer = await app.services.signer.get(data.id, tx)
  if (!signer.emailVerified) {
    return
  }
  const institution = await app.services.institution.get({id: signer.institutionId}, tx)
  const accountRequest = await app.services.accountRequest.get(signer.accountRequestId, tx)

  // fetch Product
  const product = _.get(accountRequest, 'productConfigurations[0].product', { name: '-' })
  const productName = product.name

  // build email required information
  const emailData = {
    prospectFirstName: signer.firstName,
    statusEmailSubject: emailSubject(),
    email: signer.email,
    accountType: productName,
    institution: institution.name,
    institutionUrl: institution.domain,
  }

  // validate params for email
  const emailParams = validator(emailData, prospectPendingSignersSchema, { abortEarly: false })

  const result = await app.plugins.email.awsSend('prospectPendingSignersEmail', emailParams)
  logger.debug(`[prospectPendingSigners] email sent for id ${id}`)
  return result
}

module.exports = prospectPendingSigners
