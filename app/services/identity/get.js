const Joi = require('@hapi/joi')
const app = require("../../core")

const Model = app.models.identity
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.identity.create')

const schema = Joi.object().keys({
  frontDocId: Joi.string().uuid().required(),
  backDocId: Joi.string().uuid().required()
})

async function get(params, tx = app.db) {
  logger.debug(params, '[get] started with params')
  params = validator(params, schema, { abortEarly: false })

  // ensure that documents exists before going to s3
  const [frontDoc, backDoc] = await Promise.all([
    app.services.document.get({id: params.frontDocId}, tx),
    app.services.document.get({id: params.backDocId}, tx)
  ])
  const [frontIdProof, backIdProof] = await Promise.all([
    app.plugins.aws.getContent(frontDoc.key),
    app.plugins.aws.getContent(backDoc.key)
  ])
  const payload = { backIdProof, frontIdProof }
  const data = await app.plugins.microblink.getIdentity(payload)
  logger.debug(`[get] ended with document number [${data.documentNumber}]`)
  return new Model(data).data()
}

module.exports = get
