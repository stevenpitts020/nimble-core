const axios = require('axios')
const config = require('../../config')
const _ = require('lodash')
const app = require('../core')
const logger = app.logger.getLogger('app.repositories.comply_advantage')

class ComplyAdvantage {

  constructor(secret, baseUrl) {
    this.secret = secret
    this.baseAPIURL = baseUrl
    this.config = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Token ${this.secret}`,
      },
      maxContentLength: Infinity
    }
  }

  async post(path, data) {
    try {
      return await axios.post(`${this.baseAPIURL}${path}`, data, this.config)
    } catch (err) {
      logger.error(_.get(err, 'response.data', err), '[post] got this response from ComplyAdvantage()')
      if (_.has(err, 'response.message')) {
        throw new Error(err.response.message)
      }
      throw err
    }
  }

  async getCertificate(searchId) {
    return await axios.get(`${this.baseAPIURL}/searches/${searchId}/certificate`, {
      headers: {
        Authorization: `Token ${this.secret}`,
      },
      responseType: 'arraybuffer',
    })
  }
}

const secret = config.get('complyAdvantage').secret
const baseUrl = config.get('complyAdvantage').baseUrl

module.exports = new ComplyAdvantage(secret, baseUrl)
