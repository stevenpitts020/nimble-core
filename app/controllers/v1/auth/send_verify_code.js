const app = require('../../../core')
const service = app.services.auth
//
// async function send_verify_code(req, res) {
//   try {
//     const { id } = req.body
//     await service.sendVerifyCode(id).then(() => {
//       // console.log('res in send verify code', res)
//     })
//     return res.status(200).json({ message: 'Verification code sent!' })
//   } catch (error) {
//     // console.log('error in send verify controller', error)
//     res.status(500).json({ message: 'Something went wrong' })
//   }
// }

async function send_verify_code() {
  return service.sendVerifyCode()
}

module.exports = send_verify_code
