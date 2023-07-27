const axios = require('axios')
const config = require('../../config')
const moment = require('moment')
const logger = require('./logger').getLogger('app.plugins.shufti')

class Shufti {

  constructor(baseUrl, webhookEndpoint, clientId, secret) {
    this.baseAPIURL = baseUrl
    this.authentication = Buffer.from(`${clientId}:${secret}`).toString('base64')
    this.webhook = webhookEndpoint
  }

  get baseUrl() { return this.baseAPIURL }

  async getUserVerification(userData, signerId) {
    logger.info(`[getUserVerification] called for signer [${signerId}]`)
    const token = this.authentication
    const config = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${token}`
      }
    }
    const data = this.buildRequestPayload(userData, signerId)
    const response = await axios.post(`${this.baseAPIURL}/api/`, data, config)
    switch (response.data.event) {
      case 'request.unauthorized':
        logger.error(response.data.error, `[getUserVerification] error for signer [${signerId}] on event ${response.data.even}`)
        throw this._buildError(401, response.data.event, response.data.error)
      case 'request.invalid':
        logger.error(response.data.error, `[getUserVerification] error for signer [${signerId}] on event ${response.data.even}`)
        throw this._buildError(400, response.data.event, response.data.error)
      default:
        logger.info(`[getUserVerification] finished for signer [${signerId}]`)
        return response.data
    }
  }

  _buildError(status, event, error) {
    return { isShufti: true, response: { status, event, statusText: error.message } }
  }

  buildRequestPayload(userData, signerId) {
    const payload = this.getPayload(userData.email, signerId)

    const documentType = userData.idProofType === 'USDL' ? 'driving_license' : 'passport'
    const documentPayload = this.buildDocumentVerificationPayload(
      documentType,
      userData.frontIdProof,
      userData.backIdProof,
      userData.firstName,
      userData.middleName,
      userData.lastName,
      userData.dateOfBirth,
      userData.documentIssuedDate)

    const facePayload = this.buildFaceVerificationPayload(userData.selfie)
    const addressPayload = this.buildAddressVerificationPayload(
      documentType,
      userData.frontIdProof,
      userData.firstName,
      userData.middleName,
      userData.lastName,
      userData.fullAddress)

    return { ...payload, ...facePayload, ...documentPayload, ...addressPayload }
  }

  buildDocumentVerificationPayload(documentType, base64Image, additionalBase64Image, firstName, middleName, lastName, dateOfBirth, documentIssuedDate) {
    return {
      document: {
        proof: base64Image,
        additional_proof: additionalBase64Image,
        name: {
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName
        },
        dob: moment(dateOfBirth).format('YYYY-MM-DD'),
        issue_date: moment(documentIssuedDate).format('YYYY-MM-DD'),
        allow_offline: '1',
        supported_types: [documentType]
      }
    }
  }

  /** build json payload for face check */
  buildFaceVerificationPayload(base64Image) {
    return {
      face: {
        proof: base64Image,
        allow_offline: '1'
      }
    }
  }

  /** build json payload for backgroundcheck */
  buildBackgroundChecksPayload(firstName, middleName, lastName, dateOfBirth) {
    return {
      background_checks: {
        name: {
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName
        },
        dob: moment(dateOfBirth).format('YYYY-MM-DD')
      }
    }
  }

  /** build payload for address verification */
  buildAddressVerificationPayload(documentType, base64Image, firstName, middleName, lastName, fullAddress) {
    return {
      address: {
        proof: base64Image,
        name: {
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName
        },
        full_address: fullAddress,
        address_fuzzy_match: '1',
        allow_offline: '1',
        supported_types: [documentType]
      }
    }
  }

  getPayload(endUserEmail, signerId) {
    let payload = {
      reference: signerId,
      callback_url: this.webhook,
      // end-user country. TODO assuming it's US
      country: '',
      // what kind of proofs will be provided to Shufti Pro for verification?
      verification_mode: 'any'
    }
    // only add email in case we actually have an email, otherwise the
    // verification type will become onsite, because reasons
    if (endUserEmail && endUserEmail !== '') {
      payload = { ...payload, email: endUserEmail }
    }

    return payload
  }
}

const baseUrl = config.get('shufti.baseUrl')
const secret = config.get('shufti.secret')
const clientId = config.get('shufti.clientId')
const webhook = config.get('shufti.webhook')
  .replace(':protocol', config.get('protocol'))
  .replace(':api_domain', config.get('domain'))

module.exports = new Shufti(baseUrl, webhook, clientId, secret)
