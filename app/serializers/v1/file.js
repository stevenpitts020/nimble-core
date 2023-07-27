const defaultSerializer = require('../serializer')

const includes = [
  'id',
  'key',
  'createdById',
  'createdByRole',
  'createdAt',
  'updatedAt',
  'acl',
  'size',
  'mimetype',
  'name',
  'version'
]

module.exports = data => defaultSerializer(includes, data)
