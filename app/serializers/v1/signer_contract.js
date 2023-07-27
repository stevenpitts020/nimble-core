const defaultSerializer = require('../serializer')

const properties = ['url', 'expiresAt']

function serializer(data) {
  return defaultSerializer(properties, data)
}

module.exports = serializer
