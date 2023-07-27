const app = require('../../core')
const Joi = require('@hapi/joi')

const InstitutionBranch = app.repositories.institutionBranch
const InstitutionBranchModel = app.models.institutionBranch
const getPagination = app.plugins.pagination
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.institution_branch.list')

function schema() {
  return Joi.object().keys({
    institutionId: Joi.string().uuid().required(),
    limit: Joi.number().positive(),
    offset: Joi.number().positive().allow(0)
  })
}

async function list(filters = {}, tx = app.db) {
  logger.debug(filters, '[list] started with filters')
  filters = await validator(filters, schema())
  const pagination = getPagination(filters)

  // check if institution exists
  await app.services.institution.get({ id: filters.institutionId }, tx)

  // query branch list
  const qb = InstitutionBranch.query(q => {
    q.limit(pagination.limit).offset(pagination.offset)

    if (filters.institutionId) {
      q.where('institution_id', filters.institutionId)
    }

    q.orderByRaw(`institution_branches.name ASC, id DESC`)
  })

  const data = await qb.fetchAll({
    withRelated: [],
    transacting: tx
  })

  // build model array
  return Promise.all(data.models.map(async (model) => {
    return new InstitutionBranchModel(model).data()
  }))
}

module.exports = list
