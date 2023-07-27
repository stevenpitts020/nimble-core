const defaultSerializer = require('../serializer')

const properties = ['strategy', 'remoteId', 'createdAt']

function serializer(data) {
  return defaultSerializer(properties, data)
}

module.exports = serializer
