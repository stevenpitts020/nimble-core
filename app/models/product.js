const Joi = require('@hapi/joi')
const _ = require('lodash')

const app = require('../core')
const BaseModel = require('./model')

class ProductModel extends BaseModel {
  constructor(data) {
    super(ProductModel.props(), ProductModel.relations(), data)
  }

  static props() {
    return ['id', 'name', 'category', 'sku', 'summary', 'content', 'createdAt', 'institutionId']
  }

  static relations() {
    return ['options']
  }

  data() {
    const ProductOptionModel = app.models.productOption
    const optionsMap = 'options' in this._data
      ? this._data.options.map(entryData => new ProductOptionModel(entryData).data())
      : []

    return {
      ..._.omit(this._data, 'options'),
      options: optionsMap,
    }
  }

  static categorizeOptions(options = []) {
    return _.groupBy(options, (o) => o.category)
  }

  static schema(operation = 'update') {
    if (operation === 'create') {
      return Joi.object().keys({
        institutionId: Joi.string().uuid().required(),
        name: Joi.string().required(),
        sku: Joi.string().required(),
        category: Joi.string().required().valid('CHECKING', 'SAVINGS', 'CD'),
        summary: Joi.string().required(),
        contentRaw: Joi.string().required(),
      })
    }

    throw new Error('Invalid schema operation.')
  }
}

module.exports = ProductModel
