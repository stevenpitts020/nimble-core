const _ = require('lodash')
const app = require('../../core')
const knex = app.db.knex
const User = app.repositories.user
const UserMFA = app.repositories.userMfa
const AccountOneTimeToken = app.repositories.accountOneTimeToken
const BadRequestError = require('../../errors/bad_request')
const UnauthorizedError = require('../../errors/unauthorized')
const moment = require('moment')
const { hash, emailNormalizer, mfaVerify } = app.plugins

const logger = app.logger.getLogger('login_one_time_token')

async function mfaExpired(mfaCacheToken, email) {
  const userMFA = await UserMFA.forge({ id: mfaCacheToken }).fetch()

  if (!userMFA) {
    return true
  }

  if (userMFA.get('email') !== email) {
    return true
  }

  const expiresAt = moment(userMFA.get('expiresAt'))
  const now = moment()

  return now.isAfter(expiresAt)
}

async function mfaVerified(mfaCacheToken) {
  const userMFA = await UserMFA.forge({ id: mfaCacheToken }).fetch()
  return userMFA.get('verified')
}

async function generateMFACacheToken(email, oneTimeToken) {
  const { id } = await UserMFA.forge({
    email: email,
    token: oneTimeToken,
    expiresAt: moment().add(24 * 7, 'hours')
  }).save(null, { method: 'insert' })

  return id
}

async function updateMFACacheToken(mfaCacheToken, oneTimeToken) {
  await UserMFA
    .forge({ id: mfaCacheToken })
    .save({ token: oneTimeToken }, { method: 'update', patch: true })
}

async function acquireMFACacheToken(user, credentials) {
  if (!mfaVerify.isEnabled()) {
    logger.warn('skipping MFA because it\'s not configured')
    return null
  }

  const phone = user.get('phone')

  if (!phone) {
    // There is no phone number assigned to user. First acquire phone number.
    return null
  }

  const email = emailNormalizer(credentials.email)
  const oneTimeToken = credentials.token
  let mfaCacheToken = credentials.mfaCacheToken

  if (!mfaCacheToken || await mfaExpired(mfaCacheToken, email)) {
    mfaCacheToken = await generateMFACacheToken(email, oneTimeToken)
  }

  if (await mfaVerified(mfaCacheToken)) {
    // MFA has already been verified and not expired, no need to verify again.
    return null
  }

  await updateMFACacheToken(mfaCacheToken, oneTimeToken)

  try {
    await mfaVerify.createVerification(phone)
  } catch(err) {
    const msg = _.toLower(err.message || '')
    if (msg.includes(phone) && msg.includes('invalid')) { // invalid phone number: delete and continue
      logger.error({ err, msg: err.message, resolve: `deleting User[${user.get('id')}].phone` })

      try {
        await User.forge({ id: user.get('id') }).save({ phone: null }, { method: 'update', patch: true })
      } catch(err) {
        logger.error(err)
      }

      return null
    }

    throw err // rethrow
  }

  return mfaCacheToken
}

async function login_one_time_token(credentials, transacting = app.db) {
  const email = emailNormalizer(credentials.email)
  if (_.isEmpty(email)) throw new BadRequestError('EmailRequired')

  const oneTimeToken = credentials.token
  if (_.isEmpty(oneTimeToken)) throw new BadRequestError('TokenRequired')

  const maskedToken = hash('sha256', oneTimeToken)

  const accountOneTimeToken = await AccountOneTimeToken
    .forge({ token: maskedToken, consumedAt: null })
    .where('expires_at', '>=', knex.raw('NOW()'))
    .fetch({ withRelated: 'account', transacting })

  if (!accountOneTimeToken) throw new UnauthorizedError()

  const userId = accountOneTimeToken.related('account').get('userId')

  const user = await User.forge({ id: userId, status: 'ACTIVE' }).fetch({ transacting })

  if (!user) throw new UnauthorizedError('who?')

  if (_.toLower(user.get('email')) !== _.toLower(email)) throw new UnauthorizedError('which?')

  const mfaCacheToken = await acquireMFACacheToken(user, credentials)
  if (mfaCacheToken) {
    return {
      mfaCacheToken: mfaCacheToken,
      mfaMaskedPhone: `+1${user.get('phone').replace(/\d(?=\d{3})/g, '*')}`
    }
  }

  const now = moment()

  await AccountOneTimeToken
    .forge({ id: accountOneTimeToken.get('id') })
    .save({ consumedAt: now }, { method: 'update', patch: true })

  user.save({ lastLoginAt: now }, { method: 'update', patch: true })

  const bearerOpts = {
    userId: userId.toString(),
    expiration: app.config.get('auth').ttl
  }
  const token = app.services.token.get(bearerOpts)

  return { token }
}

module.exports = login_one_time_token
