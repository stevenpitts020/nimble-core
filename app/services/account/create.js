const _ = require('lodash')

const app = require('../../core')
const Account = app.repositories.account
const AccountModel = app.models.account
const validator = app.plugins.validator

const whitelist = AccountModel.props()

async function validate(account) {
  let data = _.pick(account, whitelist)
  validator(data, AccountModel.schema(), { abortEarly: false })
  return data
}

async function create(account, tx = app.db) {
  const data = await validate(account)

  const model = await Account.forge(data).save(null, { method: 'insert', transacting: tx})
  return app.services.account.get(model.get('id'), tx)
}

module.exports = create
