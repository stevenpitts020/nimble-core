const _ = require('lodash')
const Joi = require('@hapi/joi')
const app = require('../../core')
const validator = app.plugins.validator

const SignerIdentityVerification = app.repositories.signerIdentityVerification
const SignerIdentityVerificationModel = app.models.signerIdentityVerification
const logger = app.logger.getLogger('app.services.identity_verification.list')

const whitelist = ['id']
const entrySchema = Joi.object().keys({
  id: Joi.string().uuid().required(),
})

async function validate(params) {
  const data = _.pick(params, whitelist)
  validator(data, entrySchema, { abortEarly: false })
  return data
}


const verificationsSchema = {
  'Face': [
    'Face Detection',
    'Face On Document Matched'
  ],
  'Document': [
    'Originality',
    'Visibility',
    'Document Type',
    'Issued Date',
    'Expiration Date',
    'Name',
    'Country',
    'Date Of Birth',
    'Gender',
    'Address'
  ]
}


function getVerificationStatusFromList(array, key) {
  return array.find((item) => { // find will return the relevant result (assuming ordered by most recent)
    return item.verification === _.snakeCase(key)
  })
}


async function list(id, tx = app.db) {
  logger.debug(`[list] started for signer id [${id}]`)
  const data = await validate({ id })

  // fetch the signer
  const signer = await app.services.signer.get(data.id, tx)

  // query the verification table
  // order by most recent
  const qb = SignerIdentityVerification.query(q => {
    q.where('signer_id', signer.id)
    q.orderBy('updated_at', 'DESC')
    q.orderBy('created_at', 'DESC')
  })

  // map the model
  const dbVerifications = (await qb.fetchAll({transacting: tx})).map(row => new SignerIdentityVerificationModel(row).data())

  // map out the schema into rows
  const out = _.map(verificationsSchema, ((keys, category) => {
    return keys.map(key => { // for revery key in category
      // find the database info
      const item = getVerificationStatusFromList(dbVerifications, key)
      if (!item) {
        return null
      }

      // assign object
      return {
        "id": item.id,
        "verification": key,
        "category": category,
        "date": item.updatedAt,
        "status": item.status
      }
    }).filter(i => !!i) // remove nulls
  }))

  return _.flatten(out) // flatten to remove category top levels
}

module.exports = list
