const config = require('../../config')
const logger = require('./logger').getLogger('app.plugins.html_to_pdf')
const aws = require('./aws')

class HTMLToPDF {
  constructor(lambdaARN) {
    this.lambdaARN = lambdaARN
  }

  /**
   * Transform a HTML content into a PDF
   *
   * @param {string} htmlContent
   */
  async transform(htmlContent = '') {
    const result = await aws.invokeLambda({
      FunctionName: this.lambdaARN,
      Payload: JSON.stringify({ html: htmlContent })
    })

    // note: data inside Payload is already base64
    if(result && result.Payload) {
      return JSON.parse(result.Payload).data
    }

    logger.debug('[HTMLToPDF] - problem invoking lambda ', result.FunctionError)
    return null
  }
}

const lambdaARN = config.get('lambda').pdfTransformARN

module.exports = new HTMLToPDF(lambdaARN)
