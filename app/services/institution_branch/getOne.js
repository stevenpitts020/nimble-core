const app = require('../../core')
const InstitutionBranch = app.repositories.institutionBranch
const InstitutionBranchModel = app.models.institutionBranch

async function getOne(filters = {}, tx = app.db) {
  const branch = await InstitutionBranch.forge(filters).fetch({ transacting: tx })
  return !branch ? null : new InstitutionBranchModel(branch).data()
}

module.exports = getOne
