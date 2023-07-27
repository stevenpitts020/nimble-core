const _ = require('lodash')
const Joi = require('@hapi/joi')
const app = require('../../core')
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.email.email_verification')

const verificationEmailSchema = Joi.object().keys({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  signerFirstName: Joi.string().required(),
  signerEmail: Joi.string().email({ tlds: { allow: false } }).required(),
  verifyUrl: Joi.string().required(),
  institution: Joi.string().required(),
  institutionUrl: Joi.string().required(),
  statusEmailSubject: Joi.string().required()
})

const whitelist = ['id']
const entrySchema = Joi.object().keys({
  id: Joi.string().uuid().required()
})

async function validate(params) {
  const data = _.pick(params, whitelist)
  validator(data, entrySchema, { abortEarly: false })
  return data
}

function verificationUrl(signerId, emailVerificationId, domain) {
  const token = app.services.token.get({
    scopes: ['signers.email_verifications'],
    resources: [`signers.email_verifications#${signerId}`],
    expiration: 999999999 // endless
  })

  return app.config.get('frontend.signerEmailVerificationURI')
    .replace(':protocol', app.config.get('protocol'))
    .replace(':onboarding_domain', app.config.get('frontend.onboarding_domain'))
    .replace(':signer_id', signerId)
    .replace(':id', emailVerificationId)
    .replace(':domain', domain)
    .replace(':token', token)
}

function emailSubject() {
  return `Confirm your email address`
}

async function emailVerification(emailVerificationId, tx = app.db) {
  logger.debug(`[emailVerification] starting for email verification id ${emailVerificationId}`)
  await validate({ id: emailVerificationId })

  // fetch the verification and associated signer
  const emailVerification = await app.services.emailVerification.get(emailVerificationId, tx)
  const institution = await app.services.institution.get({ id: emailVerification.signer.institutionId }, tx)

  // build email required information
  const emailData = {
    email: emailVerification.signer.email,
    signerEmail: emailVerification.signer.email,
    signerFirstName: emailVerification.signer.firstName || emailVerification.signer.email.split('@').shift(),
    verifyUrl: verificationUrl(emailVerification.signer.id, emailVerification.id, institution.domain),
    institution: institution.name,
    institutionUrl: institution.domain,
    statusEmailSubject: emailSubject()
  }

  // // validate params for email
  const emailParams = validator(emailData, verificationEmailSchema, { abortEarly: false })

  const result = await app.plugins.email.awsSend('signerEmailVerificationEmail', emailParams)

  logger.debug(`[emailVerification] sent for email verification id ${emailVerificationId}`)
  return result
}

module.exports = emailVerification
