const _ = require('lodash')

const app = require('../core')
const BaseModel = require('./model')

class AccountRequestProduct extends BaseModel {
  constructor(data) {
    super(AccountRequestProduct.props(), AccountRequestProduct.relations(), data)
  }

  static props() {
    return ['accountRequestId', 'productId', 'initialDeposit', 'createdAt']
  }

  static relations() {
    return ['product']
  }

  data() {
    const Product = app.models.product

    return {
      ..._.omit(this._data, 'product'),
      product: new Product(this._data.product).data()
    }
  }
}

module.exports = AccountRequestProduct
