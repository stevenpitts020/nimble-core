// const bcrypt = require('bcrypt')
// const crypto = require('crypto')
// const moment = require('moment/moment')
// const app = require('../../../core')
//
// const UserModel = app.models.user
// const usersService = app.services.user
// const tokenService = app.services.token
// const oneTimeTokenService = app.services.applicantOneTimeToken
// const { mfaVerify } = app.plugins
//
// const Roles = UserModel.roles()

// async function verifyCode(res,id){
//   const sentSuccess = await mfaVerify.sendVerificationCode(id)
//
//   if (!sentSuccess){
//     return res.status(500).json({ message: 'Something went wrong', status:false })
//   }
//
//   if (sentSuccess){
//     const saltRounds = 10
//     const unHashedVerificationToken = crypto.randomBytes(10).toString('hex')
//     let saltData = ""
//
//     bcrypt.genSalt(saltRounds, function(err, salt) {
//       if (err){
//         return res.status(500).json({msg: err})
//       }
//
//       saltData = salt
//
//       bcrypt.hash(unHashedVerificationToken, salt, function(err, hash) {
//         if (err){
//           return res.status(500).json({msg: err})
//         }
//
//         // Store hashed one-time-token to DB.
//         const oneTimeTokenData = {
//           phone: id,
//           hashedVerificationToken: hash,
//           salt: saltData,
//           expiration: moment().add(60, 'minutes').unix(),
//           isAlreadyUsed: false
//         }
//
//         oneTimeTokenService.create(oneTimeTokenData)
//
//         return res.status(200).json({id: id, verification_token: unHashedVerificationToken})
//       })
//     })
//   }
// }

// async function tokenExchange(req,res){
//   const {id, verification_token, verification_code } = req.body
//
//   if (!verification_token) {
//     throw new Error('No Verification Token found')
//   }
//
//   if (!verification_code) {
//     throw new Error('No Verification Code found')
//   }
//
//   try {
//     const hashedTokenList = await oneTimeTokenService.getUnused(id)
//     const tokenListLength = hashedTokenList.length
//
//     if (tokenListLength === 0){
//       // return error if no unused Verification Token found for that phone number
//       return res.status(500).json({ message: 'Verification Token not found or already used', status:false })
//     }
//
//     for(const item of hashedTokenList){
//       const hashedToken = item.attributes.hashedVerificationToken
//       const tokenExpiration = parseInt(item.attributes.expiration)
//       const timeNowUnix = moment().unix()
//
//       if (tokenExpiration < timeNowUnix){
//         res.status(500).json({ message: 'Verification Token expired', status:false })
//       }
//
//       const result = bcrypt.compareSync(verification_token, hashedToken)
//
//       if (result === true) {
//         const isValid = await mfaVerify.isApproved(id, verification_code)
//
//         if (isValid) {
//           const roles = Object.values([Roles.Applicant])
//           const formattedId = id.toString().replace(/\D/g, "")
//           const newUserData = {
//             phone: formattedId,
//             roles: [...roles],
//             institutionId: "2552ab85-08da-4bb5-be00-9e94d282d311",
//             branchId: "2552ab85-0000-0000-0000-000000000001",
//             email: `placeholder-email-id-for-${formattedId}@nimblefi.com`
//           }
//
//           const newUser = await usersService.createApplicant(newUserData, "local")
//
//           const tokenOptions = {
//             userId: newUser.id.toString(),
//             expiration: 86400 // 24 hours
//           }
//           const accessToken = await tokenService.get(tokenOptions)
//
//           // Mark isAllReadyUsed=true for this one time token
//           await oneTimeTokenService.markAlreadyUsed({ id: item.id })
//
//           return res.status(200).json({ user: newUser, access_token: accessToken, status: true })
//         } else {
//           return res.status(400).json({message:"Invalid Code!", status:false})
//         }
//       }
//     }
//
//     // return error if provided Verification Token not matched with any hashed token
//     return res.status(500).json({ message: 'Verification Token not found or already used', status:false })
//   } catch (err){
//     return res.status(500).json({ message: 'Something went wrong', status:false })
//   }
// }

// async function auth_tokens(req, res) {
//   try {
//     const { id, role, method } = req.body
//
//     if (!id){
//       return res.status(500).json({ message: 'Wrong parameters', status:false })
//     }
//
//     if (role && role === "applicant"){
//       if (method === "verify-code"){
//         await verifyCode(res,id)
//       } else if (method === "token-exchange"){
//         await tokenExchange(req,res,id)
//       } else {
//         return res.status(500).json({ message: 'Wrong parameters', status:false })
//       }
//     } else {
//       return res.status(500).json({ message: 'Wrong parameters', status:false })
//     }
//   } catch (error) {
//     if (error && error.message){
//       return res.status(500).json({ message: error.message, status:false })
//     } else {
//       return res.status(500).json({ message: 'Something went wrong', status:false })
//     }
//   }
// }

const app = require('../../../core')
const service = app.services.auth

async function auth_tokens() {
  return service.authToken()
}

module.exports = auth_tokens
