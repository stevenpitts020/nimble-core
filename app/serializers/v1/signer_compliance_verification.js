const _ = require('lodash')
const app = require('../../core')
const defaultSerializer = require('../serializer')
const downloadableSerializer = require('./downloadable')

const properties = [
  'id',
  'status',
  'searchObject',
  'reference',
  'signerId',
  'createdAt',
  'updatedAt'
]

function serializer(data) {
  let format = defaultSerializer(properties, data)

  if (_.has(data, 'results')) {
    format.results = data.results.map(item => app.serializers.v1.signerComplianceVerificationItem(item))
  } else {
    format.results = []
  }

  format.report = downloadableSerializer({ id: data.documentId })

  return format
}

module.exports = serializer
