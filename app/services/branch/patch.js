const _ = require('lodash')
const app = require('../../core')
const { NotFoundError } = require('bookshelf/lib/errors')
const InstitutionBranch = app.repositories.institutionBranch
const InstitutionBranchModel = app.models.institutionBranch
const validator = app.plugins.validator

const whitelist = InstitutionBranchModel.props()

async function validate(branch) {
  let data = _.pick(branch, whitelist)
  validator(data, InstitutionBranchModel.patchSchema(), { abortEarly: false })
  return data
}

async function patch(branch, transacting = app.db) {
  const institutionbranches = app.services.institutionBranch

  const patch = await validate(branch)

  const exists = await institutionbranches.get(patch.id, transacting)

  if (!exists) throw NotFoundError(`institution_branch[${patch.id}]`)

  await InstitutionBranch.forge({ id: patch.id }).save(patch, { method: 'update', patch: true })

  return institutionbranches.get(patch.id)
}

module.exports = patch
