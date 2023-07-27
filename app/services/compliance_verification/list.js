const _ = require('lodash')
const Joi = require('@hapi/joi')
const app = require('../../core')
const validator = app.plugins.validator

const SignerComplianceVerification = app.repositories.signerComplianceVerification
const SignerComplianceVerificationModel = app.models.signerComplianceVerification

const whitelist = ['id']
const entrySchema = Joi.object().keys({
  id: Joi.string().uuid().required(),
})

async function validate(params) {
  const data = _.pick(params, whitelist)
  validator(data, entrySchema, { abortEarly: false })
  return data
}

async function list(id, tx = app.db) {
  // check if valid id
  await validate({ id })

  // fetch the signer
  const signer = await app.services.signer.get(id, tx)

  // get compliance verification for the signer
  const qb = SignerComplianceVerification.query(q => {
    q.where('signer_id', signer.id)
    q.orderBy('updated_at', 'DESC')
    q.orderBy('created_at', 'DESC')
  })

  // map the model
  const dbVerifications = (
    await qb.fetchAll({
      withRelated: ['results', 'results.items'],
      transacting: tx
    })
  ).map(row => new SignerComplianceVerificationModel(row).data())

  return dbVerifications
}

module.exports = list
