const _ = require('lodash')
const app = require('../../core')
const NotFoundError = require('../../errors/not_found')
const referrers = require('./helpers/referrers')

const AccountRequest = app.repositories.accountRequest
const AccountRequestModel = app.models.accountRequest
const validator = app.plugins.validator

const whitelist = [...AccountRequestModel.props(), 'deleted']

async function validate(params) {
  let data = _.pick(params, whitelist)
  validator(data, AccountRequestModel.schema('patch'), { abortEarly: false })
  return data
}

async function patch(params, tx = app.db) {
  const data = await validate(params)
  const id = data.id

  const existing = await app.services.accountRequest.get(id, tx)

  if (!existing) throw new NotFoundError(`AccountRequestNotFound[${id}]`)

  const accountRequest = { ..._.omit(data, AccountRequestModel.relations()) }

  // FIXME: referrers is deprecated; exists for backward compatibility with CRM
  accountRequest.referrers = data.referrers ? JSON.stringify(data.referrers) : '[]'

  // FIXME: referrers id deprecated; resolve referredById if not provided using referrers
  if (!_.isEmpty(data.referrers) && !_.has(data, 'referredById')) accountRequest.referredById = _.get(data.referrers, '0.id')

  await referrers.normalizeReferredById(accountRequest, existing.institutionId, tx) // mutates data.referredById

  await AccountRequest.forge({ id }).save(accountRequest, {
    method: 'update',
    patch: true,
    transacting: tx
  })

  return await app.services.accountRequest.get(id, tx)
}

module.exports = patch
