const BaseModel = require('./model')
const Joi = require('@hapi/joi')
const app = require('../core')
const _ = require('lodash')

class InstitutionBranchModel extends BaseModel {

  constructor(data) {
    super(InstitutionBranchModel.props(), InstitutionBranchModel.relations(), data)
  }

  static props() {
    return ['id', 'name', 'externalId', 'institutionId', 'routingNumber', 'street', 'street2', 'city', 'state', 'zip', 'active', 'note']
  }

  static relations() {
    return ['institution']
  }

  data() {
    const institution = this._data.institution
    const data = { ..._.omit(this._data, ['institution']) }
    if (institution) data.institution = new app.models.institution(institution).data()
    return data
  }

  static createSchema() {
    return Joi.object().keys({
      name: Joi.string().required(),
      institutionId: Joi.string().required(),
      externalId: Joi.string().required(),
      routingNumber: Joi.string().optional(),
      street: Joi.string().optional(),
      street2: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zip: Joi.string().optional(),
      active: Joi.boolean().default(true),
      note: Joi.string().optional()
    })
  }

  static patchSchema() {
    return Joi.object().keys({
      id: Joi.string().uuid().required(),
      name: Joi.string(),
      externalId: Joi.string(),
      routingNumber: Joi.string(),
      street: Joi.string(),
      street2: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      zip: Joi.string(),
      active: Joi.boolean().default(true),
      note: Joi.string()
    })
  }
}

module.exports = InstitutionBranchModel
