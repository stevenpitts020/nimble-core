const _ = require('lodash')
const bcrypt = require('bcrypt')

const app = require('../../core')
const ConflictError = require('../../errors/conflict')
const User = app.repositories.user
const Account = app.repositories.account
const UserModel = app.models.user
const validator = app.plugins.validator

const whitelist = UserModel.props()

async function validate(user) {
  let data = _.pick(user, whitelist)
  validator(data, UserModel.updateSchema(), { abortEarly: false })
  return data
}

async function update(user) {
  const UserService = app.services.user

  const data = await validate(user)

  //check if email is free
  if (_.has(data, 'email')) {
    const existingUser = await User.forge({ email: data.email }).fetch()
    if (existingUser && existingUser.get('id') !== data.id) {
      throw new ConflictError(`a user already exists with email: ${data.email}`)
    }
  }

  await app.db.transaction(async tx => {

    // check if user exists, will throw on 404
    let user = await UserService.get(data.id, tx)

    if (_.has(data, 'password')) {
      // reset failed login attempts
      data.failedLoginAttempts = 0

      const secret = await bcrypt.hash(data.password, 10)
      delete data.password // remove password from the original obj

      // find local strategy account
      let account = user.accounts.find(a => a.strategy === 'local')

      // update the local account
      if (account) {
        await Account.forge({ id: account.id }).save({ secret }, {
          method: 'update',
          transacting: tx
        })
      }
    }

    // update user
    await User.forge(UserModel.prePersist(data)).save(null, { method: 'update', transacting: tx })
  })
  return UserService.get(data.id)
}

module.exports = update
