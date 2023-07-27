const _ = require('lodash')
const app = require('../../core')
const logger = app.logger.getLogger('app.services.identity.verify')

async function verifyProcessStarted(signerId, tx) {
  logger.info(`[verifyProcessStarted] checking if the identity verification process should run for signer ${signerId}`)

  // query will check if the identity_verification process started by counting how many results we have saved if any
  const query = await tx.transaction(q => {
    return q.count().from('signers_identity_verifications').where('signer_id', signerId).first()
  })

  return query.count > 0
}

async function verify(signerId, tx = app.db) {
  logger.info(`[verify] called for signer [${signerId}]`)
  const signer = await app.services.signer.get(signerId, tx)
  if (signer.status == 'INVITED' || signer.status == 'INCOMPLETE') {
    logger.info(`[verify] identity checks not executed for ${signer.status} signer [${signer.id}]`)
    return Promise.resolve()
  }

  if (await verifyProcessStarted(signerId, tx)) {
    logger.info(`[verify] identity checks not executed for signer [${signer.id}] because the process had already started`)
    return Promise.resolve()
  }

  let documentIds = [signer.selfieDocumentId, signer.frontIdProofDocumentId]
  if (signer.documentType === 'USDL') {
    documentIds.push(signer.backIdProofDocumentId)
  }

  const documentPromises = documentIds.map((id) => app.services.document.get({ id: id }, tx))

  // ensure that documents exists before going to s3
  const [selfiePic, frontDoc, backDoc] = await Promise.all(documentPromises)

  // unpack document contents
  let documents = [selfiePic, frontDoc]
  if (signer.documentType === 'USDL') {
    documents.push(backDoc)
  }

  const documentAWSPromises = documents.map((doc) => app.plugins.aws.getContent(doc.key))

  const [selfie, frontIdProof, backIdProof] = await Promise.all(documentAWSPromises)

  // this will be sent to the shufti service
  let payload = {
    firstName: signer.firstName,
    middleName: signer.middleName,
    lastName: signer.lastName,
    dateOfBirth: signer.dateOfBirth,
    fullAddress: [signer.address, signer.city, signer.state, signer.zipCode].join(' '),
    email: signer.email,
    // documents
    documentIssuedDate: signer.documentIssuedDate,
    selfie,
    frontIdProof,
    idProofType: signer.documentType
  }

  if (signer.documentType === 'USDL') {
    payload = _.assign(payload, { backIdProof })
  }

  // this will be appendend to the user record
  let verification_items = []
  try {
    logger.info(`[verify] running identity checks for signer [${signer.id}]`)
    // fetch verification data
    const userVerification = await app.plugins.shufti.getUserVerification(payload, signer.id)

    const logMetadata = _.omit(userVerification, ['verification_data'])
    logger.info(logMetadata, `[verify] received the following data from [app.plugins.shufti.getUserVerification] for signer [${signer.id}]`)

    verification_items = app.services.identity.parse(userVerification.event, _.get(userVerification, 'verification_result', null))
    logger.info(verification_items, `[verify] parsed the data with [app.services.identity.parse] for signer [${signer.id}]`)

  } catch (error) {
    let msg = error.message || 'Unexpected error on identityVerification()'
    let errorEvent = _.get(error, 'response.event', 'verification.declined')
    verification_items = app.services.identity.parse(errorEvent, {})
    if (error.isShufti) {
      msg = `[verify] shufti failed for signer [${signer.id}] with status [${error.response.status}] and message [${error.response.statusText}]`
    }

    logger.error(error, msg)
  }
  logger.info(`[verify] completed identity checks for signer [${signer.id}]`)

  // save verification data
  for (const item of verification_items) {
    await app.services.identityVerification.create({ signerId: signer.id, ...item }, tx)
  }
  // save verification checks in signer
  await app.services.signer.updateIdentityVerifications({ signerId: signer.id, verificationItems: verification_items }, tx)

  return true
}

module.exports = verify
