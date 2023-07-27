const Joi = require('@hapi/joi')
const BaseModel = require('./model')
const app = require('../core')
const _ = require('lodash')

class SignerComplianceVerificationItemModel extends BaseModel {
  constructor(data) {
    super(SignerComplianceVerificationItemModel.props(), SignerComplianceVerificationItemModel.relations(), data)
  }

  static props() {
    return [
      'id',
      'fullName',
      'nameAka',
      'dateOfBirth',
      'dateOfDeath',
      'countries',
      'associates',
      'matchTypes',
      'createdAt',
      'updatedAt',
    ]
  }

  static relations() {
    return ['items']
  }

  data() {
    const SignerComplianceVerificationListEntryModel = app.models.signerComplianceVerificationListEntry
    return {
      ..._.omit(this._data, 'items'),
      items: this._data.items.map(entryData => new SignerComplianceVerificationListEntryModel(entryData).data()),
    }
  }


  static schema(operation = 'get') {
    const SignerComplianceVerificationListEntryModel = app.models.signerComplianceVerificationListEntry

    if (!['get', 'create'].includes(operation)) {
      throw new Error('Invalid schema operation.')
    }

    if (operation === 'create') {
      return Joi.object().keys({
        fullName: Joi.string().required(),
        nameAka: Joi.array().optional().items(Joi.string()).default([]),
        dateOfBirth: Joi.string().optional().allow(null).allow(''),
        dateOfDeath: Joi.string().optional().allow(null).allow(''),
        countries: Joi.array().optional().items(Joi.string()).default([]),
        associates: Joi.array().optional().items(Joi.string()).default([]),
        matchTypes: Joi.string().optional().allow(null).allow(''),
        items: Joi.array().items(SignerComplianceVerificationListEntryModel.schema('create'))
      })
    }

    return Joi.object().keys({
      id: Joi.string().uuid()
    })
  }
}

module.exports = SignerComplianceVerificationItemModel
