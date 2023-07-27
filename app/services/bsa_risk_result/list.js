const _ = require('lodash')
const app = require('../../core')
const BsaRiskResult = app.repositories.bsaRiskResult
const BsaRiskResultModel = app.models.bsaRiskResult
const schema = require('./schemas/filter')
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.bsa_risk_results.list')

const sortBy = {
  position: 'bsa_risk_results.position ASC',
  '-position': 'bsa_risk_results.position DESC',
}

function getSqlSort(sort) {
  return _.get(sortBy, sort, sortBy['position'])
}

async function list(filters = {}, tx = app.db) {
  logger.debug(`[list] called for account request id ${filters.accountRequestId}`)
  filters = await validator(filters, schema())

  if (filters.accountRequestId) {
    await app.services.accountRequest.get(filters.accountRequestId, tx)
  }

  const qb = BsaRiskResult.query((q) => {
    q.orderByRaw(getSqlSort(filters.sort))

    if (filters.accountRequestId) {
      q.where('bsa_risk_results.account_request_id', filters.accountRequestId)
    }
  })

  const data = await qb.fetchAll({
    transacting: tx
  })

  return data.models.map((m) => new BsaRiskResultModel(m).data())
}

module.exports = list
