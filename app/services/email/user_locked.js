const _ = require('lodash')
const Joi = require('@hapi/joi')
const app = require('../../core')
const NotFoundError = require('../../errors/not_found')
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.email.user_locked')

const userLockedEmailSchema = Joi.object().keys({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  userFirstName: Joi.string().required(),
  institution: Joi.string().required(),
  emailSubject: Joi.string().required(),
  cc: Joi.string().required(),
})

const whitelist = ['userId']
const entrySchema = Joi.object().keys({
  userId: Joi.string().uuid().required(),
})

async function validate(params) {
  const data = _.pick(params, whitelist)
  validator(data, entrySchema, { abortEarly: false })
  return data
}

function emailSubject() {
  return `Your account has been locked`
}

async function userLocked(userId) {
  logger.debug(`[userLocked] starting for user id ${userId}`)
  await validate({ userId })

  const user = await app.services.user.get(userId)

  if (!user) {
    throw new NotFoundError('User is missing from send email')
  }


  const emailData = {
    email: user.email,
    userFirstName: user.firstName,
    institution: user.institution.name,
    emailSubject: emailSubject(user.institution.name),
    cc: 'support@nimblefi.com'
  }

  // validate params for email
  const emailParams = validator(emailData, userLockedEmailSchema, { abortEarly: false })
  const result = await app.plugins.email.awsSend('userLockedEmail', emailParams)
  logger.debug(`[userLocked] email sent for id ${userId}`)
  return result
}

module.exports = userLocked
