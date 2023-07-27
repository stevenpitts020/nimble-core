const _ = require('lodash')

const app = require('../../core')
const logger = app.logger.getLogger('app.services.compliance.verify')

async function verifyProcessStarted(signerId, tx = app.db) {
  logger.debug(`[verifyProcessStarted] checking if the compliance verification process should run for ${signerId}`)

  // query will check if the compliance_verifications process started by counting how many results we have saved if any
  const query = await tx.transaction(q => {
    return q.count().from('signer_compliance_verifications').where('signer_id', signerId).first()
  })

  return query.count > 0
}

async function verify(signerId, tx = app.db) {
  if (!signerId) {
    logger.error(Error("SignerIdRequired"), '[verify] compliance checks failed; signerId not provided')
    throw Error('[verify] compliance checks failed; signerId not provided')
  }

  logger.info(`[verify] called with [${signerId}]`)
  const signer = await app.services.signer.get(signerId, tx)

  if (signer.status === 'INVITED' || signer.status === 'INCOMPLETE') {
    logger.info(`[verify] compliance checks not executed for ${signer.status} signer [${signer.id}]`)
    return
  }

  if (await verifyProcessStarted(signerId, tx)) {
    logger.info(`[verify] compliance checks not executed signer [${signer.id}] because the process had already started`)
    return
  }

  const payload = {
    firstName: signer['firstName'],
    lastName: signer['lastName'],
    middleName: signer['middleName'],
    dateOfBirth: signer['dateOfBirth']
  }

  const filters = ['sanction', 'pep', 'adverse-media', 'adverse-media-financial-crime']

  try {
    logger.info(`[verify] running compliance checks for signer [${signer.id}]`)

    const searchResult = await app.services.compliance.search(payload, filters)
    const parsedResults = await app.services.compliance.parse(searchResult)

    // what keys are going to be merged into item entries
    const keys = {
      'adverseMedia': 'ADVERSE-MEDIA',
      'warnings': 'WARNING',
      'politicalExposure': 'POLITICAL',
      'sanctions': 'SANCTION'
    }

    // download and save report
    logger.info(`[verify] saving compliance report for signer [${signer.id}]`)
    const searchId = _.get(searchResult, 'result.id', 'null')
    const exportDocument = await app.services.compliance.export(searchId, signer.institutionId)

    // call the create method
    logger.info(`[verify] saving compliance checks for signer [${signer.id}]`)
    await app.services.complianceVerification.create({
      signerId: signer.id,
      searchId: '' + (searchId.toString()), // force cast to string
      documentId: exportDocument.id,
      status: _.get(searchResult, 'result.match_status', 'unknown'),
      reference: _.get(searchResult, 'result.ref', 'null'),
      searchObject: searchResult.search,
      results: (parsedResults || []).map(item =>  // for each hit
        _.omit({
          ...item, // item, without the keys
          items: _.flatten(Object.keys(keys).map(type =>  // merged with a compilation of 'keys' array as results: []
            item[type].map(entry => {
              return { ...entry, type: keys[type] } // flat map with the key as type
            })
          ))
        }, Object.keys(keys))

      )
    }, tx)

  } catch (err) {
    logger.error(err, `[verify] compliance checks failed for signer: [${signer.id}]`)
    throw err
  }

  logger.info(`[verify] compliance checks completed for signer [${signer.id}]`)
}

module.exports = verify
