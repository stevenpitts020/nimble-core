const _ = require('lodash')
const moment = require('moment')
const app = require('../../core')
const defaultSerializer = require('../serializer')
const imageSerializer = require('./image')

const properties = [
  'role',
  'id',
  'status',
  'firstName',
  'middleName',
  'lastName',
  'address',
  'city',
  'state',
  'zipCode',
  'phoneNumber',
  'ssn',
  'email',
  'employer',
  'dateOfBirth',
  'emailVerified',
  'emailVerifiedAt',
  'consent',
  'consentAccountOpening',
  'consentPrivacyPolicy',
  'consentCommunication',
  'checkSanction',
  'sanctionVerifiedAt',
  'checkPoliticalExposure',
  'politicalExposureVerifiedAt',
  'checkAdverseMedia',
  'adverseMediaVerifiedAt',
  'checkAntiMoneyLaundering',
  'antiMoneyLaunderingVerifiedAt',
  'contractDocumentSignerStatus',
  'contractDocumentSignerStatusUpdatedAt',
  'invitedAt',
  'remoteMetadata'
]

const imageProperties = ['selfie']


function serializer(data) {
  const format = defaultSerializer(properties, data)

  format.dateOfBirth = format.dateOfBirth ? moment(format.dateOfBirth).format('YYYY-MM-DD') : null

  format.idProofDocument = {
    type: data.documentType,
    number: data.documentNumber,
    expirationDate: data.documentExpirationDate ? moment(data.documentExpirationDate).format('YYYY-MM-DD') : null,
    issuedDate: data.documentIssuedDate ? moment(data.documentIssuedDate).format('YYYY-MM-DD') : null,
    issuer: data.documentIssuer,
    frontIdProof: imageSerializer({ default: data.frontIdProofDocumentId}),
    backIdProof: imageSerializer({ default: data.backIdProofDocumentId})
  }

  imageProperties.forEach(p => {
    format[p] = imageSerializer({ default: data[p + 'DocumentId'] })
  })

  if (_.has(data, 'account_request')) {
    format.accountRequest = app.serializers.v1.accountRequest(data.accountRequest)
  }

  if (_.has(data, 'institution')) {
    format.institution = app.serializers.v1.institution(data.institution)
  }

  format.verificationStatus = {
    faceStatus: data.verificationStatusFace,
    faceUpdatedAt: data.verificationStatusFaceUpdatedAt,

    documentStatus: data.verificationStatusDocument,
    documentUpdatedAt: data.verificationStatusDocumentUpdatedAt,

    addressStatus: data.verificationStatusAddress,
    addressUpdatedAt: data.verificationStatusAddressUpdatedAt,

    sanctionsStatus: data.verificationStatusSanctions,
    sanctionsUpdatedAt: data.verificationStatusSanctionsUpdatedAt,

    mediaStatus: data.verificationStatusMedia,
    mediaUpdatedAt: data.verificationStatusMediaUpdatedAt,

    politicalExposure: data.verificationStatusPoliticalExposure,
    politicalExposureUpdatedAt: data.verificationStatusPoliticalExposureUpdatedAt,
  }

  return format
}

module.exports = serializer
