const defaultSerializer = require('../serializer')

const properties = ['id', 'key', 'category', 'title', 'value', 'lead', 'annotation', 'parentId']

function serializer(data = {}) {
  return defaultSerializer(properties, data)
}

module.exports = serializer
