const _ = require('lodash')
const app = require('../../core')
const InstitutionBranch = app.repositories.institutionBranch
const InstitutionBranchModel = app.models.institutionBranch
const validator = app.plugins.validator

module.exports = async function create(dto, tx = app.db) {
  const branch = _.pick(dto, InstitutionBranchModel.props())
  validator(branch, InstitutionBranchModel.createSchema(), { abortEarly: false })
  const saved = await InstitutionBranch.forge(branch).save(null, { method: 'insert', transacting: tx })
  return await app.services.institutionBranch.get(saved.id, tx)
}
