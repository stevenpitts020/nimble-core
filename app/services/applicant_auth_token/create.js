const bcrypt = require('bcrypt')
const crypto = require('crypto')
const moment = require('moment/moment')

const app = require('../../core')
const { mfaVerify } = app.plugins

const Roles = {
  SuperAdmin: 'super-admin',
  InstitutionAdmin: 'institution-admin',
  BranchAdmin: 'branch-admin',
  Employee: 'employee',
  Applicant: "applicant"
}

async function auth_tokens(body) {
  const { id, role, method } = body

  if (!id){
    return { message: 'Id is missing', status:false, statusCode: 400 }
  }

  if (!role){
    return { message: 'Role is missing', status:false, statusCode: 400 }
  }

  if (!method){
    return { message: 'Method is missing', status:false, statusCode: 400 }
  }

  if (method === "verify-code") {
    try {
      const sentSuccess = await mfaVerify.sendVerificationCode(id)

      if (!sentSuccess){
        return { message: 'Verification Code send error', status:false, statusCode: 500 }
      }

      if (sentSuccess) {
        const saltRounds = 10
        const unHashedVerificationToken = crypto.randomBytes(10).toString('hex')
        const saltData = await bcrypt.genSaltSync(saltRounds)
        const hash = await bcrypt.hash(unHashedVerificationToken, saltData)

        // Store hashed one-time-token to DB.
        const oneTimeTokenData = {
          phone: id,
          hashedVerificationToken: hash,
          salt: saltData,
          expiration: moment().add(60, 'minutes').unix(),
          isAlreadyUsed: false
        }

        await app.services.applicantOneTimeToken.create(oneTimeTokenData)

        return { id: id, verification_token: unHashedVerificationToken, status: true, statusCode: 200 }
      }
    }catch (err){
      throw new Error(err)
    }
  }
  else if (method === "token-exchange") {
    const { verification_token, verification_code } = body

    if (!verification_token) {
      return { message: 'Verification token is missing', status: false, statusCode: 400 }
    }

    if (!verification_code) {
      return { message: 'Verification code is missing', status: false, statusCode: 400 }
    }

    const hashedTokenList = await app.services.applicantOneTimeToken.getUnused(id)
    const tokenListLength = hashedTokenList.length

    if (tokenListLength === 0) {
      // return error if no unused Verification Token found for that phone number
      return { message: 'Verification Token not found or already used', status: false, statusCode: 500 }
    }

    let counter = 1

    for (const item of hashedTokenList) {
      const hashedToken = item.attributes.hashedVerificationToken
      const tokenExpiration = parseInt(item.attributes.expiration)
      const timeNowUnix = moment().unix()

      if (timeNowUnix > tokenExpiration ) {
        if (counter < tokenListLength){
          continue
        } else {
          return { message: 'Verification Token expired', status: false, statusCode: 500 }
        }
      }

      const result = bcrypt.compareSync(verification_token, hashedToken)

      if (result === true) {
        const isValid = await mfaVerify.isApproved(id, verification_code)

        if (isValid) {
          const roles = Object.values([Roles.Applicant])
          const formattedId = id.toString().replace(/\D/g, "")
          const newUserData = {
            phone: formattedId,
            roles: [...roles],
            institutionId: "2552ab85-08da-4bb5-be00-9e94d282d311",
            branchId: "2552ab85-0000-0000-0000-000000000001",
            email: `placeholder-email-id-for-${formattedId}@nimblefi.com`
          }

          const newUser = await app.services.user.createApplicant(newUserData, "local")

          const tokenOptions = {
            userId: newUser.id.toString(),
            expiration: 86400 // 24 hours
          }
          const accessToken = await app.services.token.get(tokenOptions)

          // Mark isAllReadyUsed=true for this one time token
          await app.services.applicantOneTimeToken.markAlreadyUsed({ id: item.id })

          return { user: newUser, access_token: accessToken, status: true, statusCode: 200 }
        } else {
          return { message: "Invalid Code!", status: false, statusCode: 500 }
        }
      }

      counter++
    }

    // return error if provided Verification Token not matched with any hashed token
    return { message: 'Verification Token not found or already used', status: false, statusCode: 500 }
  }
  else {
    return { message: 'Wrong parameters', status:false, statusCode: 500 }
  }
}

module.exports = auth_tokens
