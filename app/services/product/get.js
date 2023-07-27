const app = require('../../core')
const Product = app.repositories.product
const ProductModel = app.models.product
const { validator } = app.plugins
const schema = require('./schemas/get')
const logger = app.logger.getLogger('app.services.product.get')

async function get(options, tx = app.db) {
  logger.debug(options, '[get] started with options')
  const conditions = validator(options, schema(), { abortEarly: false })

  const model = await Product.forge(conditions).fetch({
    withRelated: [{
      options: (qb) => {
        qb.orderBy('category', 'ASC')
        qb.orderBy('key', 'ASC')
      }
    }],
    transacting: tx
  })

  return new ProductModel(model).data()
}

module.exports = get
