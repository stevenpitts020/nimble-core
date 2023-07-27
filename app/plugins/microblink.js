const axios = require('axios')
const moment = require('moment')
const _ = require('lodash')
const config = require('../../config')
const logger = require('./logger').getLogger('app.plugins.microblink')


class MicroblinkService {

  constructor(baseUrl, secret) {
    this.baseAPIURL = baseUrl
    this.authorization = secret
  }

  async sendDocumentsForOCR(userData) {
    logger.info(`[sendDocumentsForOCR] called for signer [${userData.email}]`)

    // Note: using USDL for identifying drivers licence
    let responseAPI = await this.sendDocumentToMicroblink(userData.backIdProof, 'USDL')

    if (responseAPI.data.result) {
      logger.info(`[sendDocumentsForOCR] ended for signer [${userData.email}]`)
      return responseAPI
    }

    // Note: this also works with PT ID cards
    responseAPI = await this.sendDocumentToMicroblink(userData.frontIdProof, 'BLINK_ID')
    logger.info(`[sendDocumentsForOCR] ended for signer [${userData.email}]`)
    return responseAPI
  }

  async sendDocumentToMicroblink(imageData, recognizerType) {
    logger.debug(`[sendDocumentToMicroblink] called`)
    recognizerType = recognizerType || 'BLINK_ID'

    const config = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.authorization}`,
      },
      maxContentLength: Infinity
    }

    const data = this.buildRequestPayload(imageData, recognizerType)
    const result = await axios.post(`${this.baseAPIURL}/recognize/execute`, data, config)
    logger.debug(`[sendDocumentToMicroblink] finished`)
    return result.data
  }

  getBasicUserDataFromMicroblinkResponse(result) {
    // handle no result
    if (result == null) {
      return {
        dateOfBirth: null,
        firstName: '',
        middleName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        documentNumber: '',
        documentExpirationDate: null,
        documentIssuedDate: null,
        documentIssuer: ''
      }
    }

    const {
      address,
      addressStreet,
      addressCity,
      addressJurisdictionCode,
      addressPostalCode,
      type,
    } = result

    const documentDetails = {
      documentNumber: result.documentNumber || '',
      documentExpirationDate: this.parseDate(result.dateOfExpiry || result.documentExpirationDate),
      documentIssuedDate: this.parseDate(result.dateOfIssue || result.documentIssueDate)
    }

    let {
      firstName,
      customerMiddleName,
      lastName
    } = result

    // different fields for MRTD scanning
    if (result.type === 'MRTD'){
      firstName = result.secondaryID
      lastName = result.primaryID
    }

    if (result.documentType === 'AAMVA'){
      firstName = result.customerFirstName
      lastName = result.customerFamilyName
    }

    let documentIssuer = ''
    if (result.issuingJurisdiction) {
      documentIssuer = result.issuingJurisdiction
    }

    return {
      documentIssuer,
      dateOfBirth: this.parseDate(result.dateOfBirth),
      lastName: _.capitalize(lastName),
      ...this.parseFirstAndMiddleName({
        firstName,
        customerMiddleName,
      }),
      ...documentDetails,
      ...this.parseMicroBlinkAddress({
        address,
        addressStreet,
        addressCity,
        addressJurisdictionCode,
        addressPostalCode,
        type,
      })
    }
  }

  parseMicroBlinkAddress(microblinkAddress) {
    if (microblinkAddress.type === 'BLINK_ID') {
      return this.parseFullAddress(microblinkAddress.address)
    }

    return {
      address: _.capitalize(microblinkAddress.addressStreet),
      city: _.capitalize(microblinkAddress.addressCity),
      state: microblinkAddress.addressJurisdictionCode,
      zipCode: microblinkAddress.addressPostalCode,
    }
  }

  parseFullAddress(fullAddress) {
    if (typeof fullAddress !== 'string') return ''
    const splitAddress = fullAddress.split('\n')

    let userAdressFields = {
      address: '',
      city: '',
      state: '',
      zipCode: '',
    }

    if (splitAddress.length > 1) {
      userAdressFields = {
        address: _.capitalize(splitAddress[0]),
        ...this.parseCityZipState(splitAddress[1]),
      }
    } else {
      userAdressFields.address = _.capitalize(fullAddress)
    }

    return userAdressFields
  }

  parseFirstAndMiddleName(joinedName) {
    const parsedName = {
      firstName: '',
      middleName: '',
    }
    if (typeof joinedName.firstName !== 'string') return parsedName

    // check if the firstName contains 2 names, ex: 'Rick James'
    const splitName = joinedName.firstName.split(' ')
    switch (splitName.length) {
      case 2:
        parsedName.firstName = _.capitalize(splitName[0])
        parsedName.middleName = _.capitalize(splitName[1])
        break
      default:
        parsedName.firstName = _.capitalize(splitName[0])
    }
    // sometimes we receive middleName in the OCR. not always
    if (joinedName.customerMiddleName) parsedName.middleName = _.capitalize(joinedName.customerMiddleName)
    return parsedName
  }

  // ex: ORLANDO, FL 17101-0000
  parseCityZipState(address) {
    const returned = {
      city: '',
      state: '',
      zipCode: '',
    }

    const comma = address.indexOf(',')

    // Pull out the city.
    returned.city = _.capitalize(address.slice(0, comma))

    // Get everything after the city.
    const after = address.substring(comma + 2) // The string after the comma, +2 so that we skip the comma and the space.

    // Find the space.
    const space = after.lastIndexOf(' ')

    // Pull out the state.
    returned.state = after.slice(0, space)

    // Pull out the zip code.
    returned.zipCode = after.substring(space + 1)

    // Return the data.
    return returned
  }

  parseDate(date) {
    if (typeof date === 'string') return this.parseUSDLDate(date)

    return this.parseAndJoinMicroblinkDate(date)
  }

  parseUSDLDate(stringDate) {
    let dateOfBirth = null

    if (moment(stringDate, 'MMDDYYYY').isValid()) {
      dateOfBirth = moment(stringDate, 'MMDDYYYY').format('YYYY-MM-DD')
    }

    return dateOfBirth
  }

  parseAndJoinMicroblinkDate(dateObject) {
    // check if date is malformed
    if(dateObject == undefined || dateObject == null || (dateObject.day == null || dateObject.year == null || dateObject.month == null)){
      return null
    }
    // microblink returns an object with separate date values
    let date = dateObject
    ? `${dateObject.year}-${
      dateObject.month.toString().length == 1
          ? '0' + dateObject.month.toString()
          : dateObject.month
      }-${
        dateObject.day.toString().length == 1
          ? '0' + dateObject.day.toString()
          : dateObject.day
      }`
    : ''

    if (!moment(date, 'YYYY-MM-DD').isValid()) {
      date = null
    }

    return date
  }

  buildRequestPayload(imageBase64, recognizerType) {
    return {
      recognizerType,
      imageBase64,
      detectGlare: false,
      exportImages: false,
      exportMrzImage: false,
      exportFullDocumentImage: false,
      DEBUG: false,
    }
  }

  async getIdentity(data) {
    logger.info(`[getIdentity] called for signer [${data.email}]`)
    try {
      const response = await this.sendDocumentsForOCR(data)
      const result = this.getBasicUserDataFromMicroblinkResponse(response.data.result)
      logger.info(`[getIdentity] finished for signer [${data.email}]`)
      return result
    } catch (err) {
      if (_.has(err.response, 'status')) {
        logger.error(err, `[getIdentity] error status [${err.response.status}] message: [${err.response.statusText}]`)
      }
      throw err
    }
  }
}

const secret = config.get('microblink').secret
const baseUrl = config.get('microblink').baseUrl

module.exports = new MicroblinkService(baseUrl, secret)
