// const config = require('../../config')

// const accountSid = config.get('twilio.accountSid')
// const serviceSid = config.get('twilio.serviceSid')
// const authToken = config.get('twilio.authToken')

const accountSid = "AC0cb2381b7efb6f8b47ebde709b1d74e6"
const serviceSid = "VAfc8c1349196f6572c317aaff4a5075b6"
const authToken = "7fd100bb4d96bbde0718581c7598de47"

/**
 * Normalize phone numbers, currently only US numbers supported.
 */
function normalize(phone) {
  if (!phone) return phone
  if (phone.startsWith('+1')) return phone
  if (phone.startsWith('1')) return '+' + phone
  return '+1' + phone
}

class MFAVerify {
  constructor() {
    if (accountSid && authToken) {
      this.client = require('twilio')(accountSid, authToken)
    }
  }

  isEnabled() {
    return this.client && serviceSid
  }

  async createVerification(to) {
    to = normalize(to)
    this.client = require('twilio')(accountSid, authToken) // remove after testing

    await this.client.verify.services(serviceSid)
      .verifications
      .create({ to, channel: 'sms' })
  }

  async sendVerificationCode(to) {
    to = normalize(to)
    this.client = require('twilio')(accountSid, authToken) // remove after testing

    const verification = await this.client.verify.services(serviceSid)
      .verifications
      .create({ to, channel: 'sms' })

    return verification.status === "pending"
  }

  async isApproved(to, code) {
    to = normalize(to)
    const verification = await this.client.verify.services(serviceSid)
      .verificationChecks
      .create({ to, code })

    // console.log("verificationisApproved",verification)
    return verification.status === 'approved'
  }
}

module.exports = new MFAVerify()
