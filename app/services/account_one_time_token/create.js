const _ = require('lodash')
const Joi = require('@hapi/joi')
const moment = require('moment')
const uuid = require('uuid')

const app = require('../../core')
const NotFoundError = require('../../errors/not_found')
const User = app.repositories.user
const AccountOneTimeToken = app.repositories.accountOneTimeToken
const { hash, validator, emailNormalizer } = app.plugins

const whitelist = ['email']
const schema = Joi.object().keys({
  email: Joi.string().email({ tlds: { allow: false } }).required()
})

const logger = app.logger.getLogger('app.services.account_one_time_token.create')

async function validate(params) {
  const data = _.pick(params, whitelist)
  validator(data, schema, { abortEarly: false })
  return data
}

async function create(email, tx = app.db) {
  logger.info(`CreateOneTimeToken[${email}]`)

  email = emailNormalizer(email) // coerce into canonical

  await validate({ email })

  const token = uuid.v1()

  const maskedToken = hash('sha256', token)

  const user = await User.forge({ email }).fetch({ withRelated: ['accounts'], transacting: tx })

  if (!user) throw new NotFoundError(`UserNotFound[email:${email}]`)

  const account = user.related('accounts').toJSON().find(account => account.strategy === 'local')

  if (!account) throw new NotFoundError(`UserAccountNotFound[email:${email}]`)

  const oneTimeToken = {
    token: maskedToken,
    accountId: account.id,
    expiresAt: moment().add(24, 'hours').toISOString()
  }

  await AccountOneTimeToken.forge(oneTimeToken).save(null, {
    method: 'insert',
    transacting: tx
  })

  return { token, expiresAt: oneTimeToken.expiresAt }
}

module.exports = create
