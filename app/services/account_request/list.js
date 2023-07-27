const app = require('../../core')
const schema = require('./schemas/filter')
const enrichProductOptions = require('./helpers/enrich_product_options')
const AccountRequest = app.repositories.accountRequest
const AccountRequestModel = app.models.accountRequest
const getPagination = app.plugins.pagination
const validator = app.plugins.validator

const sortBy = {
  '': 'account_requests.created_at DESC',
  createdAt: 'account_requests.created_at ASC',
  '-createdAt': 'account_requests.created_at DESC',
  status: 'account_requests.status ASC',
  '-status': 'account_requests.status DESC'
}

function getSqlSort(sort) {
  if (!sort) return sortBy['']
  return sortBy[sort]
}

async function list(filters = {}, tx = app.db) {
  filters = await validator(filters, schema())
  const pagination = getPagination(filters)

  const qb = AccountRequest.query(q => {
    q.limit(pagination.limit).offset(pagination.offset)

    if (filters.status) {
      if (filters.status.startsWith('!')) q.where('status', '!=', filters.status.substring(1))
      else q.where('status', filters.status)
    }

    if (filters.institutionId) q.where('institution_id', filters.institutionId)

    q.where('deleted', false) // do not show soft-deletes (TODO: allow certain admins to view)

    q.orderByRaw(`${getSqlSort(filters.sort)}, account_requests.created_at DESC, id DESC`)
  })

  const data = await qb.fetchAll({
    withRelated: [
      { 'signers': (qb) => qb.orderBy('role', 'asc').orderBy('created_at', 'asc') },
      'productConfigurations.product',
      { 'productOptions': (qb) => qb.orderBy('category', 'asc').orderBy('key', 'asc') },
      'referredBy',
      'statusUpdatedBy',
      'statusUpdatedBy.institution',
      'branch'
    ],
    transacting: tx
  })

  return Promise.all(data.models.map(async(model) => {
    let accountRequest = new AccountRequestModel(model).data()

    // fill account request product options with missing product options fields
    for (var i in accountRequest.productConfigurations) {
      if (accountRequest.productConfigurations[i].product &&
        accountRequest.productConfigurations[i].product.options) {
        accountRequest.productConfigurations[i] = await
          enrichProductOptions(accountRequest.productConfigurations[i], tx)
      }
    }
    return accountRequest
  }))
}

module.exports = list
