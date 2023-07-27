// const app = require("../../core")
// const { mfaVerify } = app.plugins
//
// async function verify_user_code(phone, code) {
//     const isValid = await mfaVerify.isApproved(phone, code)
//     if(isValid) {
//         const options = {
//             phone
//         }
//         const token = app.services.token.get(options)
//         return { token }
//     }
// }

async function verify_user_code() {
  return Promise.reject("Not implemented yet.")
}

module.exports = verify_user_code
