const defaultSerializer = require('../serializer')

const properties = ['id', 'email', 'role']

function serializer(data) {
  return defaultSerializer(properties, data)
}

module.exports = serializer
