const _ = require('lodash')
const Joi = require('@hapi/joi')
const config = require('../../../config')

const app = require('../../core')
const User = app.repositories.user
const Institution = app.repositories.institution
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.account.recover')

const whitelist = ['email']
const schema = Joi.object().keys({
  email: Joi.string().email({ tlds: { allow: false } }).required()
})

async function validate(params) {
  const data = _.pick(params, whitelist)
  validator(data, schema, { abortEarly: false })
  return data
}

async function recover(email) {
  logger.debug(`[recover] starting for email ${email}`)
  await validate({ email })
  const recovery = await app.services.accountRecovery.create(email)
  const user = (await User.forge({ email }).fetch()).toJSON()
  const institution = (await Institution.forge({ id: user.institutionId }).fetch()).toJSON()

  const emailUser = {
    ..._.pick(user, 'firstName', 'lastName', 'email'),
    institution: institution.name,
    institutionUrl: institution.domain,
  }

  const uri = config.get('frontend.recovery_password_uri')
    .replace(':protocol', config.get('protocol'))
    .replace(':backoffice_domain', config.get('frontend.backoffice_domain'))
    .replace(':email', emailUser.email)
    .replace(':code', recovery.code)
    .replace(':expiresAt', recovery.expiresAt)

  await app.plugins.email.sendPasswordRecovery({ ...emailUser, uri })
  logger.debug(`[recover] email sent for email ${email}`)
  return recovery.code
}

module.exports = recover
