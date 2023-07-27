const _ = require('lodash')

const app = require('../../core')
const User = app.repositories.user
const UserModel = app.models.user
const validator = app.plugins.validator

const whitelist = UserModel.props()

async function validate(user) {
  let data = _.pick(user, whitelist)
  validator(data, UserModel.schema(), { abortEarly: false })
  return data
}

async function create(user, tx = app.db) {
  const data = await validate(user)

  const savedUser = await User.forge(UserModel.prePersist(data)).save(null, { method: 'insert', transacting: tx})
  return await app.services.user.get(savedUser.id, tx)
}

module.exports = create
