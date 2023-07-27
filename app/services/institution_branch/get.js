const Joi = require('@hapi/joi')
const app = require('../../core')
const InstitutionBranch = app.repositories.institutionBranch
const InstitutionBranchModel = app.models.institutionBranch
const logger = app.logger.getLogger('app.services.institution_branch.get')

const schema = Joi.object().keys({ id: Joi.string().uuid() })

async function get(id, tx = app.db) {
  logger.debug(`[get] started for id [${id}]`)
  app.plugins.validator({ id }, schema, { abortEarly: false })

  const model = await InstitutionBranch.forge({ id }).fetch({
    transacting: tx,
    withRelated: ['institution']
  }).then(async m => !m ? null : m)

  return new InstitutionBranchModel(model).data()
}

module.exports = get
