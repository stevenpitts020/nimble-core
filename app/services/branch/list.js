const _ = require('lodash')
const app = require('../../core')
const BadRequestError = require('../../errors/bad_request')
const InstitutionBranch = app.repositories.institutionBranch
const InstitutionBranchModel = app.models.institutionBranch
const getPagination = app.plugins.pagination

const sortBy = {
  '': 'institution_branches.id',
  'name': 'institution_branches.name' // TODO: consider indexing
}

function getSqlSort(sort) {
  if (!sort) return sortBy['']
  return sortBy[sort]
}

function validate(filters) {
  if (_.has(filters, 'sort') && !_.has(sortBy, filters.sort)) {
    throw new BadRequestError('The sort parameter is invalid.')
  }
}

async function list(filters = {}, tx = app.db) {
  validate(filters)

  const query = InstitutionBranch.query(sql => {
    if (!filters.unlimited) {
      const pagination = getPagination(filters)
      sql.limit(pagination.limit).offset(pagination.offset)
    }

    if (filters.sort) sql.where(getSqlSort(filters.sort).split(' ').shift(), '>', 0)
    sql.orderByRaw(`${getSqlSort(filters.sort)}, institution_branches.id asc`)

    if (filters.institutionId) sql.where('institution_branches.institution_id', filters.institutionId)

    if (filters.search) sql.where(function() {
      const where = this
      filters.search.split(' ').forEach(term => where.orWhere('institution_branches.name', 'ILIKE', `${term}%`))
    })
  })

  const data = await query.fetchAll({
    transacting: tx,
    withRelated: ['institution']
  })

  return data.models.map(branch => new InstitutionBranchModel(branch).data())
}

module.exports = list
