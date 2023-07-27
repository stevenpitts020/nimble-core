const config = require('../../config')
const _ = require('lodash')
const logger = require('./logger').getLogger('app.plugins.credit_report')
const axios = require('axios')
const moment = require('moment')

const Joi = require('@hapi/joi')
const validator = require('./validator')

/**
 * SDK around the iSoftPull CreditBureau API.
 *
 * See: https://secure.isoftpull.com/index.php
 * Note: only accessible from the USA.
 */
class CreditReport {
  constructor(username, password, groupCode, lenderId, url, version=2) {
    this.baseAPIURL = url
    this.username   = username
    this.password   = password
    this.groupCode  = groupCode
    this.version    = version
    // TODO extract lenderId to institution
    this.lenderId   = lenderId
  }

  /**
   * Builds a url to access the API
   * @param {string} method
   */
  _apiURL(method = 'process_applicant'){
    return `${this.baseAPIURL}?v=${this.version}&username=${this.username}&password=${this.password}&group_code=${this.groupCode}&method=${method}`
  }

  /**
   * Clean script and link tags from html
   *
   * @param {string} htmlContent
  */
  _cleanReportHTML(htmlContent='') {
    let cleanedHTML = this._removeTagsHTML(htmlContent)
    cleanedHTML = this._injectPrintCSS(cleanedHTML)
    cleanedHTML = this._injectValidHead(cleanedHTML)

    return cleanedHTML
  }

  /**
   * Insert some basic print css into the html from iSoftPull.
   * Otherwise the tabs will hide the content.
   *
   * @param {string} htmlContent
  */
  _injectPrintCSS(htmlContent='') {
    if (_.isNull(htmlContent)) { return '' }

    const printCSS = `<style>
    body,html{font-family:Helvetica,Arial,sans-serif}#col_2_menu,#creditnav,#footer,#headerspacing,.adminreturndiv,.fa-question-circle,header{display:none!important}#tab_0,#tab_1,#tab_2,#tab_3,#tab_4,#tab_5,#tab_6,#tab_7{display:block!important}#col_2_content{padding-top:0!important}.accounttrader{overflow:hidden;display:inline-block}.hideonprint{display:none}.showonprint{display:inline-block!important}`

    return htmlContent.replace('<style>', printCSS)
  }

  /**
   * Insert some valid head and html tags into the html from iSoftPull.
   *
   * @param {string} htmlContent
  */
  _injectValidHead(htmlContent='') {
    if (_.isNull(htmlContent)) { return '' }

    const htmlHead = '<html><head><meta http-equiv="Content-type" content="text/html; charset=utf-8" /><meta charset="UTF-8" /></head><body><div class="fpn_clientarea_bg">'
    const htmlFooter = '</div><!-- end clientarea bg --></body></html>'

    let cleanedHTML = htmlContent

    cleanedHTML = cleanedHTML.replace('<div class="fpn_clientarea_bg">', htmlHead)
    cleanedHTML = cleanedHTML.replace('</div><!-- end clientarea bg -->', htmlFooter)

    return cleanedHTML
  }

  /**
   * Remove invalid tags from html
   *
   * @param {string} htmlContent
  */
  _removeTagsHTML(htmlContent='') {
    if (_.isNull(htmlContent)) { return '' }

    let cleanedHTML = htmlContent
    // remove script tags
    cleanedHTML = cleanedHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // remove link
    cleanedHTML = cleanedHTML.replace(/<link[^>]+>/ig, '')

    return cleanedHTML
  }

  /**
   * Convert signer to data that Credit Report needs
   *
   * @param {*} signer
   */
  _formatApplicantData(signer) {
    // get relevant fields from signer
    const { firstName, middleName, lastName, address, city, state, zipCode, phoneNumber, email, dateOfBirth, ssn } = signer

    const data = {
      'firstname': firstName,
      'lastname': lastName,
      'address1': address,
      'city': city,
      'state': state,
      'postcode': zipCode,
      'phone': (phoneNumber ? phoneNumber.replace(/[()']|[\s/]|[-/]+/g,'') : ''),
      'dob': (dateOfBirth ? this._convertDOB(dateOfBirth) : ''),
      'ssn': (ssn ? ssn.replace(/[\s/]|[-/]+/g,'') : ''),
      'email': email
    }

    if (!_.isEmpty(middleName)){
      data.middlename = middleName
    }

    return data
  }

  async _validate(params) {
    const listSchema = Joi.object().keys({
      firstname: Joi.string().required(),
      middlename: Joi.string().optional(),
      lastname: Joi.string().required(),
      address1: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postcode: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().required(),
      ssn: Joi.string().required(),
      dob: Joi.string().required(),
    })
    return validator(params, listSchema, { abortEarly: false })
  }

  /**
   * Convert our date format '1982-12-06' to Credit Bureau expected format MMDDYYYY
   * @param {*} dateOfBirth
   */
  _convertDOB(dateOfBirth) {
    if(_.isNull(dateOfBirth)){ return '' }

    let dateStr = dateOfBirth
    if (_.isDate(dateOfBirth)) {
      dateStr = moment(dateOfBirth, 'YYYY-MM-DD').format('YYYY-MM-DD')
    }

    const splitArray = dateStr.split('-')
    if (splitArray.length != 3){ return '' }

    return `${splitArray[1]}${splitArray[2]}${splitArray[0]}`
  }

  /**
   * Parse date from API into a iso format
   * @param {*} unixTimeStamp
   */
  _getDate(unixTimeStamp) {
    const date = moment.unix(unixTimeStamp)
    return date.toISOString()
  }

  /**
   * Parse score from API to a number. Example '8009' to 8000 and '0780' to 780
   *
   * @param {string} textScore
   */
  _getScore(textScore) {
    if (textScore == null || textScore == undefined) {
      return null
    }
    if (textScore.length == 0) {
      return 0
    }
    // when score is 0, iSoftPull returns 0004
    if (textScore == '0004') {
      return 0
    }

    if (textScore[0] === '0') {
      return parseInt(textScore.substr(1,3))
    } else {
      return parseInt(textScore)
    }
  }

  /**
   * Given a url from the report. Download the content.
   *
   * @param {string} url
   */
  async _downloadReport(url) {
    return await axios.get(url, {
      responseType: 'arraybuffer',
    })
  }

  /**
   * Process an applicant. This stores the applicant data and connects to a credit bureau.
   * @param {Signer} signer
   */
  async processApplicant(signer){
    if (_.isEmpty(signer)){
      throw new Error('Signer is empty')
    }

    logger.debug('[processApplicant] for signer id %s', signer.id)
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    }
    const authorizationFields = {
      'lenderid': this.lenderId
    }
    const applicant = await this._validate(this._formatApplicantData(signer))

    const data = {
      ...authorizationFields,
      ...applicant,
    }

    const response = await axios.post(this._apiURL('process_applicant'), data, config)
    logger.debug('[processApplicant] finished for signer id %s', signer.id)
    return response.data
  }

  /**
   * Fetches a Credit Report from iSoftPull for a given consumerid
   *
   * @param {string} reference
   */
  async fetchReport(reference){
    if (!reference) {
      throw new Error('Missing reference')
    }

    logger.debug('[fetchReport] for consumer %s', reference)
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    }
    const authorizationFields = {
      'lenderid': this.lenderId
    }

    const data = {
      ...authorizationFields,
      applicantid: reference
    }

    const response = await axios.post(this._apiURL('prequal_results'), data, config)
    logger.debug('[fetchReport] finished for consumer %s', reference)
    return response.data
  }
}

const username  = config.get('creditBureau').username
const password  = config.get('creditBureau').password
const groupCode = config.get('creditBureau').groupCode
const lenderId  = config.get('creditBureau').lenderId
const baseURL   = config.get('creditBureau').baseUrl

module.exports = new CreditReport(username, password, groupCode, lenderId, baseURL)
