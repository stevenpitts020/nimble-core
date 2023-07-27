const _ = require('lodash')
const Joi = require('@hapi/joi')
const app = require('../../../core')
const AccountRequestModel = app.models.accountRequest

function schema() {
  return Joi.object().keys({
    institutionId: Joi.string().uuid().optional(),
    status: Joi.string()
      .valid(..._.concat(AccountRequestModel.status(), AccountRequestModel.status().map(status => `!${status}`))),
    sort: Joi.string()
      .valid('createdAt', '-createdAt', 'status', '-status')
      .default('-createdAt'),
    limit: Joi.number().positive(),
    offset: Joi.number().positive().allow(0)
  })
}

module.exports = schema
