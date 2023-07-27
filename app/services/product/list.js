const _ = require('lodash')
const app = require('../../core')
const Product = app.repositories.product
const ProductModel = app.models.product
const getPagination = app.plugins.pagination
const schema = require('./schemas/filter')
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.product.list')

const sortBy = {
  id: 'products.id ASC',
  '-id': 'products.id DESC',
  name: 'products.name ASC',
  '-name': 'products.name DESC',
}

function getSqlSort(sort) {
  return _.get(sortBy, sort, sortBy['name'])
}

async function list(filters = {}, tx = app.db) {
  logger.debug(filters, '[list] started with filters')
  filters = await validator(filters, schema())
  const { limit, offset } = getPagination(filters)

  if (filters.institutionId) {
    await app.services.institution.get({ id: filters.institutionId }, tx)
  }

  const qb = Product.query((q) => {
    q.limit(limit).offset(offset)
    q.orderByRaw(getSqlSort(filters.sort))

    if (filters.institutionId) {
      q.where('products.institution_id', filters.institutionId)
    }
  })

  const data = await qb.fetchAll({
    withRelated: [{
      options: (qb) => {
        qb.orderBy('category', 'ASC')
        qb.orderBy('key', 'ASC')
      }
    }],
    transacting: tx
  })

  return data.models.map((m) => new ProductModel(m).data())
}

module.exports = list
