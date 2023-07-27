const _ = require('lodash')
const Joi = require('@hapi/joi')
const bcrypt = require('bcrypt')
const moment = require('moment')

const app = require('../../core')
const NotFoundError = require('../../errors/not_found')

const knex = app.db.knex
const Account = app.repositories.account
const AccountRecovery = app.repositories.accountRecovery
const UserAuthModel = app.models.userAuth
const validator = app.plugins.validator

// extend UserAuthModel props and schema
const whitelist = [...UserAuthModel.props(), 'code']
const schema = UserAuthModel.schema().keys({
  password: Joi.string().min(6).max(160).required(),
  code: Joi.string().required()
})

async function validate(params) {
  const data = _.pick(params, whitelist)
  validator(data, schema, { abortEarly: false })
  return data
}

function throwError() {
  throw new NotFoundError('Could not change your password. please request a new code.')
}

async function update_password(params) {
  const { email, code, password } = await validate(params)

  // updates password and expire code
  return app.db.transaction(async tx => {

    // get recovery code info
    const recovery = await AccountRecovery
      .forge({ code, consumedAt: null })
      .where("expires_at", '>=', knex.raw('NOW()'))
      .fetch({
        withRelated: 'account',
        transacting: tx
      })

    // could not find a valid row for that recovery code
    if (!recovery) {
      return throwError()
    }

    const user = await UserAuthModel.getLocalAccountByEmail(email, tx)
    const code_belongs_to = recovery.related('account').get('userId')
    const email_belongs_to = user.get('userId')

    if (code_belongs_to !== email_belongs_to) {
      return throwError()
    }

    // generate password hash for the database
    const secret = await bcrypt.hash(password, 10)

    // update secret on account
    const id = recovery.get('accountId')
    await Account.forge({ id }).save({ secret }, {
      method: 'update',
      patch: true,
      transacting: tx
    })

    // consume token
    await recovery.save({ consumedAt: moment() }, {
      method: 'update',
      patch: true,
      transacting: tx
    })

    return true
  }).catch(throwError)
}

module.exports = update_password
