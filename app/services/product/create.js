const _ = require('lodash')
const app = require('../../core')
const ConflictError = require('../../errors/conflict')
const Product = app.repositories.product
const ProductModel = app.models.product
const { validator } = app.plugins
const logger = app.logger.getLogger('app.services.product.create')

async function create(payload, tx = app.db) {
  logger.debug(payload, '[create] started with payload')
  const data = validator(payload, ProductModel.schema('create'), { abortEarly: false })

  // Ensure institution exists
  await app.services.institution.get({ id: data.institutionId })

  // Ensure no duplicate names
  const entity = await app.services.product
    .get({ name: data.name, institutionId: data.institutionId }, tx)
    .catch(() => null)
  if (entity) {
    logger.info(payload, '[create] error creating products - duplicate names')
    throw new ConflictError()
  }
  const newProduct = _.omit(data, 'contentRaw')
  newProduct.content = data.contentRaw
  const { id } = await Product.forge(newProduct).save(null, { method: 'insert', transacting: tx })
  return await app.services.product.get({ id }, tx)
}

module.exports = create
