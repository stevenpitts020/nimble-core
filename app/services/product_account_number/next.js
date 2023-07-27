const app = require('../../core')
const _ = require('lodash')
const Joi = require('@hapi/joi')
const ProductAccountNumber = app.repositories.productAccountNumber
const InternalServerError = require('../../errors/internal_server')
const ConflictError = require('../../errors/conflict')
const { validator } = app.plugins
const logger = app.logger.getLogger('app.services.product_account_number.next')

const schema = function () {
  return Joi.object().keys({
    productId: Joi.string().uuid().required(),
    accountRequestId: Joi.string().uuid().required(),
  })
}

async function next(options, tx = app.db) {
  logger.debug(`[next] started for productId [${options.productId}] and accountRequestId [${options.accountRequestId}]`)
  const { productId, accountRequestId } = validator(options, schema(), { abortEarly: false })

  return tx.transaction(async (tx) => {
    // fetch product
    const product = await app.services.product.get({ id: productId }, tx)

    // find the oldest available number for this institution
    const model = await ProductAccountNumber.query(q => {
      q.where('institution_id', product.institutionId)
      q.whereNull('account_request_id')
      q.orderBy('created_at', 'ASC')
      q.orderBy('account_number', 'ASC')
    }).fetch({ transacting: tx })

    // if we can't find an available number, reject the transaction
    if (!model) {
      logger.error(`[next] error finding an available product account number for productId [${options.productId}] institutionId [${product.institutionId}] and accountRequestId [${options.accountRequestId}]`)
      throw new ConflictError(`There are no available product option slots for this Institution[${product.institutionId}]; please contact support with the following code: f54f8e0245edef4f41c2b0e8aaa4d71f`)
    }

    const accountNumber = _.get(model.toJSON(), 'accountNumber', null)

    // if we STILL fail to find the account number
    if (!accountNumber) {
      logger.error(`[next] error finding an available product account number for productId [${options.productId}] and accountRequestId [${options.accountRequestId}]`)
      throw new InternalServerError('An error has occurred, please contact support with the following code: f54f8e0245edef4f41c2b0e8aaa4d71f')
    }

    // update ProductAccountNumber with accountRequestId
    await ProductAccountNumber.forge().where({
      institution_id: product.institutionId,
      account_number: accountNumber,
    }).save({ accountRequestId }, {
      method: 'update',
      transacting: tx
    })

    return accountNumber // return the next available number
  })

}

module.exports = next
