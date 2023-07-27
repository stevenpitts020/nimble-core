const _ = require('lodash')
const app = require('../../core')
const validator = app.plugins.validator



const Signer = app.repositories.signer
const SignerComplianceVerification = app.repositories.signerComplianceVerification
const SignerComplianceVerificationItem = app.repositories.signerComplianceVerificationItem
const SignerComplianceVerificationListEntry = app.repositories.signerComplianceVerificationListEntry

const SignerComplianceVerificationModel = app.models.signerComplianceVerification

/**
 * models work in the following structure
  signerComplianceVerification
  \
   +-- signerComplianceVerificationItem
   |   \
   |    +-- signerComplianceVerificationListEntry
   |    +-- signerComplianceVerificationListEntry
   |    +-- signerComplianceVerificationListEntry
   |
   +-- signerComplianceVerificationItem
       \
        +-- signerComplianceVerificationListEntry
        +-- signerComplianceVerificationListEntry
        +-- signerComplianceVerificationListEntry
*/

async function create(payload, tx = app.db) {
  const data = validator(payload, SignerComplianceVerificationModel.schema('create'), { abortEarly: false })

  return await tx.transaction(async tx => { // init

    // save ComplianceVerification
    const newVerification = await SignerComplianceVerification
      .forge(_.omit(data, 'results'))
      .save(null, { method: 'insert', transacting: tx })

    for (const result of data.results) { // foreach result, 

      // save ComplianceVerificationItem
      const newItem = await SignerComplianceVerificationItem
        .forge(_.omit({
          ...result,
          dateOfBirth: _.get(result, 'dateOfBirth', null),
          dateOfDeath: _.get(result, 'dateOfDeath', null),
          nameAka: _.get(result, 'nameAka', []).join(', '),
          countries: _.get(result, 'countries', []).join(', '),
          associates: _.get(result, 'associates', []).join(', '),
          signerComplianceVerificationId: newVerification.id
        }, 'items'))
        .save(null, {
          method: 'insert',
          transacting: tx
        })


      for (const entry of result.items) { // foreach result entry
        // save ComplianceVerificationListEntry
        await SignerComplianceVerificationListEntry
          .forge(_.omit({
            ...entry,
            countryCodes: _.get(entry, 'countryCodes', ['']).join(', '),
            signerComplianceVerificationItemId: newItem.id
          }, 'items'))
          .save(null, {
            method: 'insert',
            transacting: tx
          })
      }
    }


    const SignerChecks = {
      'SANCTION': 'verificationStatusSanctions',
      'ADVERSE-MEDIA': 'verificationStatusMedia',
      'POLITICAL': 'verificationStatusPoliticalExposure',
    }

    // Save signer status
    for (const findBy in SignerChecks) {
      const key = SignerChecks[findBy]
      const matchFound = data.results.find(row => row.items.find(item => item.type === findBy))

      await Signer.forge({ id: data.signerId }).save({
        [key]: matchFound ? 'MATCH' : 'NOMATCH',
        [key + 'UpdatedAt']: new Date()
      }, {
        method: 'update',
        transacting: tx
      })
    }

    return newVerification.id
  })
}

module.exports = create