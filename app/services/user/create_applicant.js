const _ = require('lodash')

const app = require('../../core')
const BadRequestError = require('../../errors/bad_request')
const NotFoundError = require('../../errors/not_found')
const User = app.repositories.user
const UserModel = app.models.user
const { validator } = app.plugins

const whitelist = UserModel.props()

async function validate(data) {
  return validator(_.pick(data, whitelist), UserModel.schema(), { abortEarly: false })
}

async function createApplicant(auth, strategy) {
  if (strategy !== 'local') {
    //currently we only allow local strategy
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

  //check if phone already used
  const existingUser = await User.forge({ phone: data.phone }).fetch()
  if (existingUser) {
    return await app.services.user.get(existingUser.id)
  } else {
    const newUser = await app.db.transaction(async tx => {
      const userData = { ...data, institutionId: institution.id, branchId: branch.id }
      return app.services.user.create(userData, tx)
    })

    return await app.services.user.get(newUser.id)
  }
}

module.exports = createApplicant
