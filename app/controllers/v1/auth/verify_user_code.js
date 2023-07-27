const app = require("../../../core")
// const InternalServerError = require("../../../../app/errors/internal_server")
const service = app.services.auth

// async function verify_user_code(req, res) {
//     try {
//         const {id, verificationCode}=req.body
//         await service.verifyUserCode(id, verificationCode)
//             .then(result => {
//                 if (result){
//                   res.status(200).json({token: result.token, status:true})
//
//                   // Todo: Save one-time token (result.token) to DB here
//
//                 } else {
//                   res.status(400).json({message:"Invalid Code!", status:false})
//                 }
//             }).catch((err) => {
//             // eslint-disable-next-line no-console
//               console.log("Error:", err)
//               res.status(500).json({message:"Error Occurred or Invalid Code!", status:false})
//             })
//     } catch (error) {
//         // console.log("error in send verify controller", error)
//         throw new InternalServerError(error.message)
//     }
// }

async function verify_user_code() {
  return service.verifyUserCode()
}

module.exports = verify_user_code
