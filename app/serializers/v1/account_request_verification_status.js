const defaultSerializer = require('../serializer')

const properties = [
  'verificationStatusFace',
  'verificationStatusDocument',
  'verificationStatusAddress',
  'verificationStatusSanctions',
  'verificationStatusMedia',
  'verificationStatusPoliticalExposure',
]

function serializer(data) {
  const format = defaultSerializer(properties, data)

  return {
    faceStatus: format.verificationStatusFace,
    documentStatus: format.verificationStatusDocument,
    addressStatus: format.verificationStatusAddress,
    sanctionsStatus: format.verificationStatusSanctions,
    mediaStatus: format.verificationStatusMedia,
    politicalExposure: format.verificationStatusPoliticalExposure,
  }
}

module.exports = serializer
