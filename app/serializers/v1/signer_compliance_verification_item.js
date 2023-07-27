const _ = require('lodash')
const app = require('../../core')
const defaultSerializer = require('../serializer')
const properties = [
  'id',
  'fullName',
  'nameAka',
  'dateOfBirth',
  'dateOfDeath',
  'countries',
  'associates',
  'matchTypes'
]

function serializer(data) {

  const format = {
    ...defaultSerializer(properties, data),
    nameAka: _.get(data, 'nameAka', []).split(", "),
    countries: _.get(data, 'countries', []).split(", "),
    associates: _.get(data, 'associates', []).split(", "),
    matchTypes: _.get(data, 'matchTypes', []).split(", ")
  }

  if (_.has(data, 'items')) {
    format.warnings = data.items
      .filter((item) => item.type == 'WARNING')
      .map(item => app.serializers.v1.signerComplianceVerificationListEntry(item))

    format.adverseMedia = data.items
      .filter((item) => item.type == 'ADVERSE-MEDIA')
      .map(item => app.serializers.v1.signerComplianceVerificationListEntry(item))

    format.sanctions = data.items
      .filter((item) => item.type == 'SANCTION')
      .map(item => app.serializers.v1.signerComplianceVerificationListEntry(item))

    format.politicalExposure = data.items
      .filter((item) => item.type == 'POLITICAL')
      .map(item => app.serializers.v1.signerComplianceVerificationListEntry(item))
  }
  return format
}
module.exports = serializer
