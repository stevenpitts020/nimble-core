const app = require('../../core')
const PreconditionFailedError = require('../../errors/precondition_failed')
const _ = require('lodash')
const BsaRiskResult = app.repositories.bsaRiskResult
const BsaRiskResultModel = app.models.bsaRiskResult
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.bsa_risk_results.create')

async function create(payload, accountRequestId, tx = app.db) {
  logger.debug(payload, `[create] started with account request [${accountRequestId}]`)
  const data = validator(payload, BsaRiskResultModel.schema('create'), { abortEarly: false })

  // Ensure account request exists
  const accountRequest = await app.services.accountRequest.get(accountRequestId, tx)

  // Ensure account request can be updated
  if (accountRequest.status === 'APPROVED' || accountRequest.status === 'DECLINED')
    throw new PreconditionFailedError(`Bsa risk result can not be created for [${accountRequest.id}] with status ${accountRequest.status}`)

  const iid = accountRequest.institutionId

  const institution = await app.services.institution.get({ id: iid }, tx)

  // remove all previous account request bsa answers
  await BsaRiskResult.where({ account_request_id: accountRequest.id }).destroy({ require: false, transacting: tx })

  // for each answer from the BSA test, we insert them into the database
  data.forEach(async(bsaRiskResult) => {
    const newBSAResult = {
      ...bsaRiskResult,
      context: _.get(institution, `publicMetadata.bsa.${bsaRiskResult.questionId}`) || {},
      version: '2',
      institutionId: iid,
      accountRequestId: accountRequest.id
    }
    // check with FRONTEND if we want to overwrite the position given from the frontend
    await BsaRiskResult.forge(newBSAResult).save(null, { method: 'insert', transacting: tx })
  })

  // save BSA score and risk factor
  const bsa = await app.services.bsaRiskResult.calculate(
    { accountRequestId: accountRequest.id },
    _.get(institution, 'publicMetadata.bsa._.thresholds'),
    tx
  )

  const accountRequestUpdatePayload = {
    id: accountRequest.id,
    bsaRisk: bsa.risk,
    bsaScore: bsa.score
  }
  await app.services.accountRequest.update(accountRequestUpdatePayload, null, tx)

  logger.info(`[create] finished for account request [${accountRequestId}]`)
  return await app.services.bsaRiskResult.list({ accountRequestId: accountRequest.id }, tx)
}

module.exports = create
