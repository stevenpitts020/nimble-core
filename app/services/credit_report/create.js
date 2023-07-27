const app = require('../../core')
const validator = app.plugins.validator

const SignerCreditReport = app.repositories.signerCreditReport
const SignerCreditReportModel = app.models.signerCreditReport
const logger = app.logger.getLogger('app.services.credit_report.create')

async function create(params, tx = app.db) {
  logger.debug(`[create] called for signer id ${params.signerId}`)
  const data = validator(params, SignerCreditReportModel.schema('create'), { abortEarly: false })
  // check if signer exists
  await app.services.signer.get(data.signerId, tx)

  const { id } = await SignerCreditReport.forge(data).save(null, { method: 'insert', transacting: tx })
  logger.debug(`[create] finished for signer id ${params.signerId}`)
  return id
}

module.exports = create
