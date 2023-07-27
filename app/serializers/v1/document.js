const defaultSerializer = require('../serializer')

const properties = ['id', 'format', 'createdAt']

function serializer(data) {
  return defaultSerializer(properties, data)
}

module.exports = serializer
