const _ = require('lodash')
const app = require('../../core')
const defaultSerializer = require('../serializer')
const downloadableSerializer = require('./downloadable')
const verificationStatusSerializer = require('./account_request_verification_status')

const properties = [
  'id',
  'status',
  'branchId',
  'signers',
  'createdAt',
  'statusUpdatedBy',
  'statusUpdatedAt',
  'statusEmailSubject',
  'statusEmailBody',
  'contractDocumentCreatedAt',
  'contractDocumentEnvelopeStatus',
  'contractDocumentEnvelopeStatusUpdatedAt',
  'referrers', // FIXME: deprecated; exits for backward compatibility
  'referredBy',
  'productConfigurations',
  'branch'
]

function serializer(data) {
  const format = defaultSerializer(properties, data)

  format.contract = downloadableSerializer({ id: data.contractDocumentId })
  format.verificationStatus = verificationStatusSerializer(data.verificationStatus)

  if (data.referredBy) format.referredBy = app.serializers.v1.user(data.referredBy)

  if (data.statusUpdatedBy) {
    format.statusUpdatedBy = app.serializers.v1.user(data.statusUpdatedBy)
  }

  if (_.has(data, 'signers')) {
    format.signers = data.signers.map(app.serializers.v1.signer)
  }

  if (_.has(data, 'productConfigurations')) {
    format.productConfigurations = data.productConfigurations.map(app.serializers.v1.productConfiguration)
  }

  if (data.branch) {
    format.branch = app.serializers.v1.institutionBranch(data.branch)
  }

  // transform into prop object
  if (_.has(data, 'bsaRisk') && _.has(data, 'bsaScore')) {
    format.bsa = {
      risk: data.bsaRisk,
      score: data.bsaScore
    }
  } else {
    // for backwards compatibility
    format.bsa = {
      risk: null,
      score: 0
    }
  }

  // FIXME: deprecated; exists for backward compatibility with CRM
  if (data.referrers) format.referrers = data.referrers.map(ref => _.pick(ref, ['id', 'email', 'name']))

  return format
}

module.exports = serializer
