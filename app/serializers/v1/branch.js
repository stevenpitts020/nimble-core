const defaultSerializer = require('../serializer')
const app = require('../../core')

const properties = [
  'id',
  'name',
  'externalId',
  'institution',
  'routingNumber',
  'street',
  'street2',
  'city',
  'state',
  'zip',
  'active',
  'note'
]

function serializer(data) {
  let branch = defaultSerializer(properties, data)

  if (data.institution) branch.institution = app.serializers.v1.institution(data.institution)

  return branch
}

module.exports = serializer
