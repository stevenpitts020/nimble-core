const _ = require('lodash')
const bcrypt = require('bcrypt')

const app = require('../../core')
const UserAuthModel = app.models.userAuth
const User = app.repositories.user
const BadRequestError = require('../../errors/bad_request')
const UnauthorizedError = require('../../errors/unauthorized')
const { validator, emailNormalizer } = app.plugins
const moment = require('moment')
const MAX_FAILED_LOGIN_ATTEMPTS = app.config.get('auth').maxFailedLoginAttempts

async function validate(data) {
  validator(data, UserAuthModel.schema(), { abortEarly: false })
  return _.pick(data, UserAuthModel.props())
}

async function login(auth, strategy, tx = app.db) {
  if (strategy !== 'local') {
    //currently we only allow local strategey
    throw new BadRequestError()
  }

  const data = await validate(auth)

  const email = emailNormalizer(data.email)

  // Validate is user is blocked
  let user = await User.forge({ email: email }).fetch({ transacting: tx })
  if (!user || user.get('failedLoginAttempts') >= MAX_FAILED_LOGIN_ATTEMPTS) {
    throw new UnauthorizedError()
  }

  // If user is not blocked proceed with login
  user = await UserAuthModel.getLocalAccountByEmail(email, tx)
  if (!user) {
    throw new UnauthorizedError()
  }

  const userId = user.get('userId')
  // Always use hashed passwords and fixed time comparison
  const valid = await bcrypt.compare(data.password, user.get('secret'))
  if (!valid) {
    const failedLoginAttempts = user.get('failedLoginAttempts') + 1
    await User.forge({ id: userId }).save(
      { failedLoginAttempts: failedLoginAttempts },
      { method: 'update', patch: true }
    )
    // if it reaches the max the user is blocked and the email is sent
    if (failedLoginAttempts === MAX_FAILED_LOGIN_ATTEMPTS) {
      await app.services.email.userLocked(userId)
    }

    throw new UnauthorizedError()
  }

  // reset failedLoginAttempts on successful login
  await User.forge({ id: userId }).save({ failedLoginAttempts: 0, lastLoginAt: moment() }, { method: 'update', patch: true })

  const options = {
    userId: userId.toString(),
    expiration: app.config.get('auth').ttl
  }
  const token = app.services.token.get(options)
  return { token }
}

module.exports = login
