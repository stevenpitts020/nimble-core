const _ = require('lodash')
const Joi = require('@hapi/joi')
const app = require('../../core')

const getPagination = app.plugins.pagination
const validator = app.plugins.validator

const SignerCreditReport = app.repositories.signerCreditReport
const SignerCreditReportModel = app.models.signerCreditReport
const logger = app.logger.getLogger('app.services.credit_report.list')

const listSchema = Joi.object().keys({
  signerId: Joi.string().uuid().required(),
  sort: Joi.string().valid('updated_at', '-updated_at').default('updated_at'),
  limit: Joi.number().positive(),
  offset: Joi.number().positive().allow(0),
})

const sortBy = {
  updated_at: 'signer_credit_reports.updated_at ASC',
  '-updated_at': 'signer_credit_reports.updated_at DESC',
}

async function validate(params) {
  return validator(params, listSchema, { abortEarly: false })
}

function getSqlSort(sort) {
  return _.get(sortBy, sort, sortBy['-updated_at'])
}

async function list(params = {}, tx = app.db) {
  logger.debug(params, '[list] called with params')
  const filters = await validate(params)
  const { limit, offset } = getPagination(filters)
  // fetch the signer
  await app.services.signer.get(filters.signerId, tx)

  const query = SignerCreditReport.query((q) => {
    q.limit(limit).offset(offset)
    q.orderByRaw(getSqlSort(filters.sort))
    q.where('signer_id', filters.signerId)
  })

  const data = await query.fetchAll({
    transacting: tx
  })

  return data.models.map((m) => new SignerCreditReportModel(m).data())
}

module.exports = list
