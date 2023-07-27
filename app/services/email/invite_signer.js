const _ = require('lodash')
const Joi = require('@hapi/joi')
const app = require('../../core')
const moment = require('moment')
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.email.invite_signer')

const inviteeEmailSchema = Joi.object().keys({
  inviteeName: Joi.string().required(),
  statusEmailSubject: Joi.string().required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  invitedByFirstName: Joi.string().required(),
  invitedByFullName: Joi.string().required(),
  inviteeRole: Joi.string().required().valid('primary', 'secondary'),
  accountType: Joi.string().required(),
  url: Joi.string().required(),
  institution: Joi.string().required(),
  institutionUrl: Joi.string().required()
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

function inviteeUrl(signer, invitedBy, institution) {
  const token = app.services.token.get({
    scopes: ['signers'],
    resources: [`signers#${signer.id}`],
    expiration: 432000 // 5 days
  })

  return app.config.get('frontend.inviteeOnboardingURI')
    .replace(':protocol', app.config.get('protocol'))
    .replace(':onboarding_domain', app.config.get('frontend.onboarding_domain'))
    .replace(':prospect_id', signer.accountRequestId)
    .replace(':signer_id', signer.id)
    .replace(':invitedBy', invitedBy.firstName)
    .replace(':domain', institution.domain)
    .replace(':token', token)
}

function emailSubject(invitedName, institutionName) {
  return `${invitedName} has invited you to join ${institutionName}`
}

async function inviteSigner(id, tx = app.db) {
  logger.debug(`[inviteSigner] starting for signer id ${id}`)
  const data = await validate({ id })

  // fetch the invitee
  const signer = await app.services.signer.get(data.id, tx)
  // fetch the account request
  const accountRequest = await app.services.accountRequest.get(signer.accountRequestId, tx)
  // fetch the originator (acording to accountRequest.createdById)
  const invitedBy = await app.services.signer.get(accountRequest.createdById, tx)
  // fetch institution
  const institution = await app.services.institution.get({ id: accountRequest.institutionId }, tx)
  // fetch Product
  const product = _.get(accountRequest, 'productConfigurations[0].product', { name: '-' })
  const productName = product.name

  // build email required information
  const emailData = {
    inviteeName: signer.email.split('@').shift(),
    invitedByFirstName: invitedBy.firstName,
    invitedByFullName: `${invitedBy.firstName} ${invitedBy.lastName}`,
    accountType: productName,
    email: signer.email,
    inviteeRole: signer.role.toLowerCase(),
    institution: institution.name,
    institutionUrl: institution.domain,
    url: inviteeUrl(signer, invitedBy, institution),
    statusEmailSubject: emailSubject(invitedBy.firstName, institution.name)
  }

  // validate params for email
  const emailParams = validator(emailData, inviteeEmailSchema, { abortEarly: false })

  const result = await app.plugins.email.awsSend('inviteeSignupEmail', emailParams)
  await app.services.signer.update({ id, status: 'INVITED', invitedAt: moment().toISOString() }, tx)
  logger.debug(`[inviteSigner] sent for id ${id}`)
  return result
}

module.exports = inviteSigner
