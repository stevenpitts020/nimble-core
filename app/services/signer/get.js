const app = require('../../core')
const Signer = app.repositories.signer
const SignerModel = app.models.signer
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.signer.get')

function validate(id) {
  return validator(id, SignerModel.schema('get'), { abortEarly: false })
}

async function get(id, tx = app.db) {
  logger.debug(`[get] started for signer [${id}]`)
  await validate(id)

  const signer = await Signer.forge({ id }).fetch({
    withRelated: ['account_request'],
    transacting: tx
  })

  return new SignerModel(signer).data()
}


module.exports = get
