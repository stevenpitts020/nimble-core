const _ = require('lodash')
const app = require('../../core')
const logger = app.logger.getLogger('app.services.identity.parse')

// map the result from the API to each verification
const VERIFICATIONS = {
  'face': 'face_detection',
  'document.face_on_document_matched': 'face_on_document_matched',
  'document.document': 'originality',
  'document.document_visibility': 'visibility',
  'document.selected_type': 'document_type',
  'document.issue_date': 'issued_date',
  'document.document_must_not_be_expired': 'expiration_date',
  'document.name': 'name',
  'document.document_country': 'country',
  'document.dob': 'date_of_birth',
  'address.address_document': 'address',
  // 'gender',
}

// if the event matches the key, overwrite the value.
const EVENTS = {
  'request.invalid': 'INVALID',
  'request.pending': 'PENDING',
  'verification.cancelled': 'PENDING',
  'request.timeout': 'PENDING',
  'request.unauthorized': 'PENDING',
  'request.deleted': 'PENDING',
  'request.received': 'PENDING',

  'verification.declined': null,
  'verification.accepted': null,

  // IGNORE THE FOLLOWING EVENT
  // 'verification.status.changed': null
}


function parse(event, verification_result) {
  if (!_.has(EVENTS, event)) {
    logger.info(`[parse] ignoring data from event [${event}] during parse`)
    return []
  }

  return Object.keys(VERIFICATIONS).map(key => {
    const status = _.get(verification_result, key) === 1 ? 'VALID' : 'INVALID'
    return {
      'verification': VERIFICATIONS[key],
      'status': EVENTS[event] || status
    }
  })
}

module.exports = parse
