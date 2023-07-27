const _ = require('lodash')
const app = require('../../core')
const ConflictError = require('../../errors/conflict')
const { NotFoundError } = require('bookshelf/lib/errors')
const User = app.repositories.user
const UserModel = app.models.user
const validator = app.plugins.validator
const { emailNormalizer } = app.plugins

const whitelist = UserModel.props()

async function validate(user) {
  let data = _.pick(user, whitelist)
  validator(data, UserModel.patchSchema(), { abortEarly: false })
  return data
}

async function patch(user, transacting = app.db) {
  const users = app.services.user

  const patch = await validate(user)

  const exists = await app.services.user.get(patch.id, transacting)

  if (!exists) throw NotFoundError(`user[${patch.id}]`)

  if (patch.email) {
    patch.email = emailNormalizer(patch.email)

    if (exists.email !== patch.email && await User.forge({ email: patch.email }).fetch({ transacting })) {
      throw new ConflictError(`EmailTaken[${patch.email}]`)
    }
  }

  // if the branch is changing, ensure it exists in the institution
  if (patch.branchId && !(await app.services.institutionBranch.getOne(
    { id: patch.branchId, institutionId: patch.institutionId || exists.institutionId }, transacting))
  ) throw new NotFoundError(`Branch[${patch.branchId}]NotFoundInInstitution[${patch.institutionId || exists.institutionId}]`)

  // remove readonly fields
  delete patch['password']
  delete patch['createdAt']
  delete patch['lastLoginAt']

  await User.forge({ id: patch.id }).save(UserModel.prePersist(patch), { method: 'update', patch: true })

  return users.get(patch.id)
}

module.exports = patch
