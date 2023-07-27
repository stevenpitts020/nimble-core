const _ = require('lodash')
const Joi = require('@hapi/joi')
const moment = require('moment')

const app = require('../../core')
const NotFoundError = require('../../errors/not_found')
const User = app.repositories.user
const AccountRecovery = app.repositories.accountRecovery
const validator = app.plugins.validator
const rand = app.plugins.random

const whitelist = ['email']
const schema = Joi.object().keys({
  email: Joi.string().email({ tlds: { allow: false } }).required()
})

async function validate(params) {
  const data = _.pick(params, whitelist)
  validator(data, schema, { abortEarly: false })
  return data
}

async function create(email) {
  await validate({ email })

  // generate random X00XXX code
  const code = rand.generateRecoveryCode()

  // fetch user by email with related accounts
  const user = await User.forge({ email }).fetch({
    withRelated: ['accounts']
  })

  if (!user) {
    throw new NotFoundError('Could not find an user with that email.')
  }

  // get local auth strategy account
  const account = user.related('accounts').toJSON().find(a => a.strategy == 'local')

  if (!account) {
    throw new NotFoundError('Could not find an user account with that email.')
  }

  const recovery = {
    code,
    accountId: account.id,
    expiresAt: moment().add(24, 'hours').toISOString()
  }

  await app.db.transaction(async tx => {
    const model = await AccountRecovery.forge(recovery).save(null, {
      method: 'insert',
      transacting: tx
    })
    return model.get('id')
  })

  return _.pick(recovery, 'code', 'expiresAt')
}

module.exports = create
