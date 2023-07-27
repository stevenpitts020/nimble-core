const _ = require('lodash')
const Joi = require('@hapi/joi')
const app = require('../../core')
const NotFoundError = require('../../errors/not_found')
const config = require('../../../config')
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.email.welcome')

const welcomeEmailSchema = Joi.object().keys({
  statusEmailSubject: Joi.string().required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  uri: Joi.string().required(),
  institution: Joi.string().required(),
  institutionUrl: Joi.string().required(),
})

const whitelist = ['userId']
const entrySchema = Joi.object().keys({
  userId: Joi.string().uuid().required()
})

async function validate(params) {
  const data = _.pick(params, whitelist)
  validator(data, entrySchema, { abortEarly: false })
  return data
}

function emailSubject(name) {
  return `You have been added to ${name} Nimble Account`
}

function welcomeUri(email, code, expiresAt) {
  return app.config.get('frontend.welcome_uri')
    .replace(':protocol', config.get('protocol'))
    .replace(':onboarding_domain', app.config.get('frontend.onboarding_domain'))
    .replace(':email', email)
    .replace(':code', code)
    .replace(':expiresAt', expiresAt)
}

async function welcome(userId) {
  logger.debug(`[welcome] starting for user id ${userId}`)
  await validate({ userId })

  const user = await app.services.user.get(userId)

  if (!user) {
    throw new NotFoundError('User is missing from send email')
  }

  const recoveryInfo = await app.services.accountRecovery.create(user.email)

  const emailData = {
    ..._.pick(user, 'email', 'firstName', 'lastName'),
    statusEmailSubject: emailSubject(user.institution.name),
    uri: welcomeUri(user.email, recoveryInfo.code, recoveryInfo.expiresAt),
    institution: user.institution.name,
    institutionUrl: user.institution.domain
  }

  // validate params for email
  const emailParams = validator(emailData, welcomeEmailSchema, { abortEarly: false })

  await app.plugins.email.awsSend('welcomeEmail', emailParams)
  logger.debug(`[welcome] email sent for id ${userId}`)
}

module.exports = welcome
