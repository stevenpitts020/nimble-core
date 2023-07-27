const _ = require('lodash')
const app = require('../../core')
const creditReportAPI = require('../../plugins/credit_report')
const logger = app.logger.getLogger('app.services.credit_report.fetch')

const whitelistSuccessCodes = [1004, 1006, 1004, 1007]

/**
 * Fetch a report for a signer and create/associate a record
 *
 * @param {uuid} signerId
 * @param {app.db} tx
 */
async function fetch(signerId, tx = app.db) {
  logger.info(`[fetch] called with signer [${signerId}]`)
  const signer = await app.services.signer.get(signerId, tx)

  if (signer.status === 'INVITED' || signer.status === 'INCOMPLETE') {
    logger.info(`[fetch] aborting because signer [${signer.id}] is ${signer.status}`)
    return Promise.resolve()
  }

  // first we need to send data to Credit Bureau and get a consumerId for the report
  const result = await creditReportAPI.processApplicant(signer)

  if (_.isEmpty(result.prequal)) {
    logger.error(`[fetch] response from Credit Bureau is empty for signer [${signer.id}]`)
    throw new Error('[fetch] response from Credit Bureau is empty')
  }

  const { code, code_type, message, applicant } = result.prequal.response
  logger.info({ applicant, code, code_type, message }, `[fetch] response from iSoftPull [${signer.id}]`)

  const data = {
    reference: _.get(result.prequal.response, 'applicant.consumerid', '').toString(),
    score: null,
    reportDate: null,
    errorCode: null,
    signerId: signer.id,
  }

  // If there was a invalid completion code we save a record with no score and a error code
  if (!whitelistSuccessCodes.includes(code)) {
    logger.error(`[fetch] could not process the applicant or find a credit file for signer [${signerId}]`)
    data.errorCode = 'generic_error'

    await app.services.creditReport.create(data)
    return Promise.resolve()
  }

  // get the report and parsed information using the consumerId
  const { url, score, updatedAt } = await app.services.creditReport.parse(data.reference)
  logger.info(`[fetch] parsed report: ${score} and ${updatedAt} for signer [${signer.id}]`)

  await tx.transaction(async tx => {
    // download the report
    const document = await app.services.creditReport.export(url, signer.institutionId)
    // create the report
    await app.services.creditReport.create({
      ...data,
      score: score,
      documentId: document.id,
      reportDate: updatedAt,
    }, tx)

    return true
  })

  logger.info(`[fetch] completed for signer [${signer.id}]`)
  return Promise.resolve()
}

module.exports = fetch
