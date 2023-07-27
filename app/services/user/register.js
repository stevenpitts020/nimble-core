const _ = require('lodash')
const bcrypt = require('bcrypt')
const uuid = require('uuid')

const app = require('../../core')
const User = app.repositories.user
const UserModel = app.models.user
const BadRequestError = require('../../errors/bad_request')
const ConflictError = require('../../errors/conflict')
const NotFoundError = require('../../errors/not_found')
const { validator, emailNormalizer } = app.plugins

const whitelist = UserModel.props()

async function validate(data) {
  return validator(_.pick(data, whitelist), UserModel.adminCreationSchema(), { abortEarly: false })
}

async function register(auth, strategy, notify = true) {
  if (strategy !== 'local') {
    //currently we only allow local strategey
    throw new BadRequestError()
  }

  const data = await validate(auth)

  const institution = await app.services.institution.get({ id: data.institutionId })

  if (!institution) {
    throw new NotFoundError('Institution not found')
  }

  const branch = await app.services.institutionBranch.getOne({ id: data.branchId, institutionId: data.institutionId })

  if (!branch) {
    throw new NotFoundError('Institution branch not found')
  }

  const email = emailNormalizer(data.email)

  //check if email is free
  const existingUser = await User.forge({ email }).fetch()
  if (existingUser) {
    throw new ConflictError(`A user already exists with email: ${email}`)
  }

  const newUser = await app.db.transaction(async tx => {
    const userData = { ...data, institutionId: institution.id, branchId: branch.id }
    const user = await app.services.user.create(userData, tx)

    const secret = await bcrypt.hash(uuid.v1(), 10)

    //create account with auth strategy
    await app.services.account.create({ strategy, secret, userId: user.id }, tx)

    return user
  })

  const userData = await app.services.user.get(newUser.id)

  if (notify) app.services.email.welcome(newUser.id)

  return userData
}

module.exports = register
