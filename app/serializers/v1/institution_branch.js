const defaultSerializer = require('../serializer')

const properties = [
  'id',
  'name',
  'externalId'
]

function serializer(data) {
  return defaultSerializer(properties, data)
}

module.exports = serializer
