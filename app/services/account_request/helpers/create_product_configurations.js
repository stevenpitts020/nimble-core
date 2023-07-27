const _ = require('lodash')
const app = require('../../../core')
const AccountRequestProduct = app.repositories.accountRequestProduct
const AccountRequestProductOption = app.repositories.accountRequestProductOption


async function createProductConfigurations(accountRequestId, data, tx = app.db) {
  // Create selected products
  for (const product of data.productConfigurations) {
    // filter out potentially bad props
    const productWhitelist = ['productId', 'accountRequestId', 'initialDeposit']
    const productData = _.pick({ ...product, accountRequestId: accountRequestId }, productWhitelist)
    await AccountRequestProduct.forge(productData).save(null, { method: 'insert', transacting: tx })

    // Create Selected Options
    if (_.has(product, 'options') && _.isArray(product.options)) {
      for (const option of product.options) {
        const productOptionsWhitelist = ['productId', 'accountRequestId', 'key', 'category', 'value', 'title']
        const optionData = _.pick({
          ...option,
          productId: product.productId,
          accountRequestId: accountRequestId
        }, productOptionsWhitelist)
        await AccountRequestProductOption.forge(optionData).save(null, { method: 'insert', transacting: tx })
      }
    }

    // fetch and assign the nex available product account number
    const newAccountNumber = await app.services.productAccountNumber.next({
      productId: product.productId,
      accountRequestId: accountRequestId
    })

    // save the account number as generic product option
    await AccountRequestProductOption.forge({
      productId: product.productId,
      accountRequestId: accountRequestId,
      category: 'account_number',
      key: 'account_number',
      title: 'Account Number',
      value: newAccountNumber
    }).save(null, { method: 'insert', transacting: tx })
  }
}

module.exports = createProductConfigurations
