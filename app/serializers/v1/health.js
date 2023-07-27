const defaultSerializer = require('../serializer')

const properties = ['status', 'message']

function serializer(data) {
  return defaultSerializer(properties, data)
}

module.exports = serializer
