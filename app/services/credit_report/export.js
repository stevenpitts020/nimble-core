const PreconditionFailedError = require('../../errors/precondition_failed')
const app = require('../../core')
const creditReportAPI = require('../../plugins/credit_report')
const HTMLToPDF = require('../../plugins/html_to_pdf')
const logger = app.logger.getLogger('app.services.credit_report.export')

async function __export(contractURL, institutionId) {
  try {
    logger.info(`[__export] started download for ${contractURL}`)

    // get report html via axios
    const query = await creditReportAPI._downloadReport(contractURL)

    if (!(query.data instanceof Buffer)) {
      throw new Error(`creditReport.export() Could not fetch report for ${contractURL}`)
    }
    logger.info(`[__export] finished download`)

    // clean up, transform into valid compliant HTML
    const htmlContent = creditReportAPI._cleanReportHTML(query.data.toString())

    // call plugin, transform into a PDF
    const docBase64 = await HTMLToPDF.transform(htmlContent)

    if (!docBase64) {
      throw new Error(`[__export] could not transform pdf ${contractURL}`)
    }

    logger.info(`[__export] finished pdf generation`)

    return await app.services.document.create({
      format: 'pdf',
      content: docBase64,
      institutionId: institutionId
    }, {
      ContentType: 'application/pdf'
    })

  } catch (err) {
    logger.info(err, `[__export] error for ${contractURL}`)
    throw new PreconditionFailedError(err)
  }
}

module.exports = __export
