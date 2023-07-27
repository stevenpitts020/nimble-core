const _ = require('lodash')
const app = require('../../../core')
const PreconditionFailedError = require('../../../errors/precondition_failed')

async function validateDocuments(data, tx = app.db) {
  if (_.has(data, 'documentType')) { // if we are sending document data
    await Promise.all([ // array with document keys
      ...(data.documentType === 'USDL' ? ['backIdProofDocumentId'] : []),
      'selfieDocumentId',
      'frontIdProofDocumentId'
    ].filter(key => _.has(data, key)) // check if present in the payload
      .map(async key => app.services.document.get({ id: _.get(data, key) }, tx)) // map to a document.get promise
    ).catch(() => { // if any of them fail to GET, we fail the create request
      throw new PreconditionFailedError('Could not fetch the documents associated with this signer')
    })
  }
}

module.exports = validateDocuments
