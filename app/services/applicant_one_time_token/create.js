const _ = require('lodash')

const app = require('../../core')
const ApplicantOneTimeToken = app.repositories.applicantOneTimeToken
const applicantOneTimeTokenModel = app.models.applicantOneTimeToken
const { validator } = app.plugins

const whitelist = applicantOneTimeTokenModel.props()

async function validate(data) {
  return validator(_.pick(data, whitelist), applicantOneTimeTokenModel.schema(), { abortEarly: false })
}

async function createApplicantOneTimeToken(tokenData, tx = app.db) {
  const data = await validate(tokenData)

  const newData = {
    phone: data.phone,
    hashed_verification_token: data.hashedVerificationToken,
    salt: data.salt,
    expiration: data.expiration,
    is_already_used: data.isAlreadyUsed,
    created_at: data.created_at,
    updated_at: data.updated_at
  }

  const savedToken = await ApplicantOneTimeToken.forge(newData).save(null, { method: 'insert', transacting: tx})
  return await app.services.applicantOneTimeToken.get(savedToken.id, tx)
}

module.exports = createApplicantOneTimeToken
