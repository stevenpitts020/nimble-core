const _ = require('lodash')
const app = require('../../../core')
const ProductOptionModel = app.models.productOption

function match(option1, option2) {
  return option1.category === option2.category && option1.key === option2.key
}

async function enrichProductOptions(productConfig, tx = app.db) {
  if (productConfig.product && productConfig.product.options) {
    let pConfigOptions = productConfig.product.options
    // get product options
    const product = await app.services.product.get({id: productConfig.productId}, tx)
    if (product) {
      // for each account request product option
      for (var i in pConfigOptions) {
        for (const pOption of product.options) {
          if (match(pConfigOptions[i], pOption)) {
            pConfigOptions[i] = new ProductOptionModel(_.merge(pOption, pConfigOptions[i])).data()
            break
          }
        }
      }
    }
  }
  return productConfig
}

module.exports = enrichProductOptions
