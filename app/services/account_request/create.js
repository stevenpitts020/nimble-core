const _ = require('lodash')

const app = require('../../core')
const AccountRequest = app.repositories.accountRequest
const AccountRequestModel = app.models.accountRequest
const createProductConfigurations = require('./helpers/create_product_configurations')
const referrers = require('./helpers/referrers')
const validator = app.plugins.validator

const whitelist = AccountRequestModel.props()

async function validate(params) {
  let data = _.pick(params, whitelist)
  validator(data, AccountRequestModel.schema('create'), { abortEarly: false })
  return data
}

async function create(params, tx = app.db) {
  const data = await validate(params)

  // check if the institution exists
  await app.services.institution.get({ id: data.institutionId }, tx)

  await referrers.normalizeReferredById(data, data.institutionId, tx) // mutates data.referredById

  const id = await tx.transaction(async() => {

    let newAccountRequest = await AccountRequest.forge({
      ..._.omit(data, AccountRequestModel.relations()),
      status: 'DRAFT'
    }).save(null, {
      method: 'insert',
      transacting: tx
    })

    if (_.has(data, 'productConfigurations')) {
      await createProductConfigurations(newAccountRequest.id, data, tx)
    }

    return newAccountRequest.get('id')
  })

  return app.services.accountRequest.get(id, tx)
}

module.exports = create
