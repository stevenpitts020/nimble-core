const _ = require('lodash')
const PreconditionFailedError = require('../../../errors/precondition_failed')
const Signer = require("../../../models/signer")

const checkDupes = (leftSigner, rightSigner, dupes) => {
  // Identify SSN duplicates
  if (leftSigner.ssn === rightSigner.ssn) {
    _.set(dupes, [rightSigner.id, 'ssn', 'message'],
      `${leftSigner.firstName || '<firstName>'} [${leftSigner.id}] cannot share the same SSN as the signer ${rightSigner.firstName} [${rightSigner.id}]`)
  }
  // Identify phoneNumber duplicates
  if (leftSigner.phoneNumber === rightSigner.phoneNumber) {
    _.set(dupes, [rightSigner.id, 'phoneNumber', 'message'],
      `${leftSigner.firstName || '<firstName>'} [${leftSigner.id}] cannot share the same phone number as the signer ${rightSigner.firstName} [${rightSigner.id}]`)
  }
}

const validateSigners = async (accountRequest, targetSigner) => {
  if (_.has(accountRequest, 'signers')) {

    const primarySigner = _.find(accountRequest.signers, signer => signer.role === Signer.PRIMARY_ROLE_NAME)    // 'PRIMARY', PRIMARY_ROLE_NAME, Signer.PRIMARY_ROLE_NAME
    if (!primarySigner) {
      throw new PreconditionFailedError('Could not identify primary signer')
    }

    if (!targetSigner) {
      throw new PreconditionFailedError('Could not find specified signer')
    }

    const dupes = {}

    checkDupes(primarySigner, targetSigner, dupes)

    // We also check against any other signers on this application
    accountRequest.signers.filter(signer => signer.id !== primarySigner.id && signer.id !== targetSigner.id)
      .forEach(signer => {
        checkDupes(signer, targetSigner, dupes)
      })

    // If duplicates have been found, we return the specifics
    if (!_.isEmpty(dupes)) {
      return dupes
    }

    return undefined
  }
}

module.exports = validateSigners
