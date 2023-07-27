const app = require('../../core')
const User = app.repositories.user
const UserMFA = app.repositories.userMfa
const { mfaVerify } = app.plugins

async function verify_code(data, transacting = app.db) {
  const mfaCacheToken = data.mfaCacheToken
  const code = data.code

  const userMFA = await UserMFA.forge({ id: mfaCacheToken }).fetch({ transacting })
  if (!userMFA) {
    return { verified: false }
  }

  const token = userMFA.get('token')
  const email = userMFA.get('email')
  const user = await User.forge({ email }).fetch({ transacting })
  const phone = user.get('phone')

  if (!phone) {
    return { verified: false }
  }

  const verified = await mfaVerify.isApproved(phone, code)
  if (!verified) {
    return { verified: false }
  }

  await UserMFA
    .forge({ id: mfaCacheToken })
    .save({ verified: true }, { method: 'update', patch: true })

  return {
    verified: true,
    email,
    token
  }
}

module.exports = verify_code
