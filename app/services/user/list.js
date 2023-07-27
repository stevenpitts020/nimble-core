const _ = require('lodash')
const app = require('../../core')
const BadRequestError = require('../../errors/bad_request')
const User = app.repositories.user
const UserModel = app.models.user
const getPagination = app.plugins.pagination

const sortBy = {
  '': 'users.id',
  'first_name': 'users.first_name', // TODO: consider indexing
  'last_name': 'users.last_name' // TODO: consider indexing
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

  const query = User.query(sql => {
    if (!filters.unlimited) {
      const pagination = getPagination(filters)
      sql.limit(pagination.limit).offset(pagination.offset)
    }

    if (filters.sort) sql.where(getSqlSort(filters.sort).split(' ').shift(), '>', 0)
    sql.orderByRaw(`${getSqlSort(filters.sort)}, users.id asc`)

    if (filters.institutionId) sql.where('users.institution_id', filters.institutionId)

    if (filters.branchId || filters.branch) sql.where('users.branch_id', filters.branchId || filters.branch)

    if (filters.status) sql.where('users.status', filters.status)

    if (filters.search) sql.where(function() {
      const where = this
      filters.search.split(' ').forEach(term => where
        .orWhere('users.first_name', 'ILIKE', `${term}%`)
        .orWhere('users.last_name', 'ILIKE', `${term}%`)
        .orWhere('users.email', 'ILIKE', `${term}%`)
      )
    })
  })

  const data = await query.fetchAll({
    withRelated: ['accounts', 'institution', 'branch'],
    transacting: tx
  })

  return data.models.map(user => new UserModel(user).data())
}

module.exports = list
