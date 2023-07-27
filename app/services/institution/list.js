const _ = require('lodash')
const app = require('../../core')
const BadRequestError = require('../../errors/bad_request')
const Institution = app.repositories.institution
const InstitutionModel = app.models.institution
const getPagination = app.plugins.pagination

const sortBy = {
  '': 'institutions.id',
  'name': 'institutions.name' // TODO: consider indexing
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

  const query = Institution.query(sql => {
    if (!filters.unlimited) {
      const pagination = getPagination(filters)
      sql.limit(pagination.limit).offset(pagination.offset)
    }

    if (filters.sort) sql.where(getSqlSort(filters.sort).split(' ').shift(), '>', 0)
    sql.orderByRaw(`${getSqlSort(filters.sort)}, institutions.id asc`)

    if (filters.search) sql.where(function() {
      const where = this
      filters.search.split(' ').forEach(term => where
        .orWhere('institutions.slug', 'ILIKE', `${term}%`)
        .orWhere('institutions.name', 'ILIKE', `${term}%`)
        .orWhere('institutions.domain', 'ILIKE', `${term}%`)
      )
    })
  })

  const data = await query
    .withCount('branches as branchesCount')
    .fetchAll({
      transacting: tx
    })

  return data.models.map(Institution => new InstitutionModel(Institution).data())
}

module.exports = list
