const _ = require('lodash')
const Joi = require('@hapi/joi')
const config = require('../../../config')

const app = require('../../core')
const BadRequestError = require('../../errors/bad_request')
const User = app.repositories.user
const Institution = app.repositories.institution
const validator = app.plugins.validator
const { emailNormalizer } = app.plugins

const whitelist = ['email']
const schema = Joi.object().keys({
  email: Joi.string().email({ tlds: { allow: false } }).required()
})

const logger = app.logger.getLogger('app.services.account.magic_link')

async function validate(params) {
  const data = _.pick(params, whitelist)
  validator(data, schema, { abortEarly: false })
  return data
}

async function magic_link(credentials, tx = app.db) {
  if (!credentials || !credentials.email) throw new BadRequestError('EmailRequired')

  const email = emailNormalizer(credentials.email)

  logger.info(`MagicLinkRequested[${email}]`)

  await validate({ email })

  const oneTimeToken = await app.services.accountOneTimeToken.create(email, tx)
  const user = (await User.forge({ email }).fetch({ transacting: tx })).toJSON()
  const institution = (await Institution.forge({ id: user.institutionId }).fetch({ transacting: tx })).toJSON()

  const emailUser = {
    ..._.pick(user, 'firstName', 'lastName', 'email'),
    institution: institution.name,
    institutionUrl: institution.domain,
  }

  const uri = config.get('frontend.magic_link_uri')
    .replace(':protocol', config.get('protocol'))
    .replace(':backoffice_domain', credentials.host || config.get('frontend.backoffice_domain'))
    .replace(':email', emailUser.email)
    .replace(':token', oneTimeToken.token)
    .replace(':expiresAt', oneTimeToken.expiresAt)

  if (process.env.NODE_ENV !== 'local') await app.plugins.email.sendMagicLink({ ...emailUser, uri })

  return uri
}

module.exports = magic_link
