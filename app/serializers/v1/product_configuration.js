const _ = require('lodash')
const app = require('../../core')
const defaultSerializer = require('../serializer')

const properties = ['productId', 'initialDeposit', 'createdAt']

function serializer(data) {
  const format = defaultSerializer(properties, data)

  if (_.has(data, 'product')) {
    format.product = app.serializers.v1.product(data.product)
  }

  return format
}

module.exports = serializer
