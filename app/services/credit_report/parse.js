const _ = require('lodash')
const xmlParse = require('xml-parser-xo')

const app = require('../../core')
const InternalServerError = require('../../errors/internal_server')
const creditReportAPI = require('../../plugins/credit_report')
const logger = app.logger.getLogger('app.services.credit_report.parse')

/**
 * Fetch and parse a report from Credit Bureau given a consumerId
 *
 * @param {*} consumerId
 */
async function parse(consumerId) {
  logger.info(`[parse] calling app.services.credit_report.fetch with consumer id [${consumerId}]`)
  const result = await creditReportAPI.fetchReport(consumerId)

  if (_.isEmpty(result) || result.length == 0) {
    logger.error(`[parse] response from Credit Bureau is empty for consumer id [${consumerId}]`)
    throw new InternalServerError('Response from Credit Bureau is empty')
  }

  const url = result[0].report_url
  const updatedAt = creditReportAPI._getDate(result[0].time_updated)
  const report = xmlParse(result[0].report_xml)

  try {
    // TODO: Refactor with another lib if we need to access more data.
    // This is cumbersome and prone to errors if structure is different
    // but other libs have too much dependencies
    const productsNode = _.find(report.children[0].children, ['name', 'Products'])
    const riskNode = _.find(productsNode.children[0].children, ['name', 'RiskModel'])
    const scoreNode = _.find(riskNode.children, ['name', 'Score'])
    const score = creditReportAPI._getScore(_.find(scoreNode.children, ['type', 'Text']).content)

    logger.info(`[parse] finished for consumer id [${consumerId}]`)
    return { url, updatedAt, score }

  } catch(err) {
    logger.error(err, '[parse] error parsing XML from Credit Bureau for consumer id %s', consumerId)
    throw new InternalServerError('Error parsing XML from Credit Bureau')
  }
}

module.exports = parse
