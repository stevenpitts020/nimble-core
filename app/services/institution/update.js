const _ = require('lodash')

const app = require('../../core')
const Institution = app.repositories.institution
const InstitutionModel = app.models.institution
const validator = app.plugins.validator
const moment = require('moment')
const random = app.plugins.random

const whitelist = InstitutionModel.props()

async function update(institution) {
  let patch = _.pick(institution, whitelist)
  validator(patch, InstitutionModel.patchSchema(), { abortEarly: false })

  await app.db.transaction(async tx => {
    let existing = await app.services.institution.get({ id: patch.id }, tx) // throws when non-existent

    // merge publicMetadata with the existing values
    if (existing.publicMetadata && patch.publicMetadata) patch = _.merge({ publicMetadata: existing.publicMetadata }, patch)

    // remove `nil` values from `publicMetadata`
    if (patch.publicMetadata) patch.publicMetadata = _.omitBy(patch.publicMetadata, _.isNil)

    if (patch.disclosures && !_.isEmpty(patch.disclosures.data)) patch.disclosures = {
      revised: moment().format(),
      count: _.size(patch.disclosures.data),
      data: patch.disclosures.data
    }

    if (patch.questions) { // merge questions
      if (!_.isEmpty(patch.questions.data)) {
        patch.questions.count = _.size(patch.questions.data)
        patch.questions.data.forEach(q => q.id = q.id || random.id(4))
      }
    }

    await Institution.forge({ id: patch.id }).save(patch, { method: 'update', patch: true, transacting: tx })
  })

  return app.services.institution.get({ id: patch.id })
}

module.exports = update
