module.exports = {
  // Invalid
  requestInvalid: require('./shufti/request_invalid'),
  requestPending: require('./shufti/request_pending'),
  // Accepted
  verificationAccepted: require('./shufti/verification_accepted'),
  // Decline
  verificationDeclinedDocument: require('./shufti/verification_declined_document'),
  verificationDeclinedDocumentExpired: require('./shufti/verification_declined_document_expired'),
  verificationDeclinedFace: require('./shufti/verification_declined_face'),
  verificationDeclinedFaceOnDocument: require('./shufti/verification_declined_face_on_document'),
  verificationDeclinedDocumentType: require('./shufti/verification_declined_document_type'),
  verificationDeclinedNoReason: require('./shufti/verification_declined_noreason'),
}
