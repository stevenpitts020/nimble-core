const Joi = require('@hapi/joi')
const BaseModel = require('./model')

class SignerComplianceVerificationListEntryModel extends BaseModel {
  constructor(data) {
    super(SignerComplianceVerificationListEntryModel.props(), SignerComplianceVerificationListEntryModel.relations(), data)
  }

  static props() {
    return [
      'id',
      'name',
      'value',
      'source',
      'date',
      'deletedDate',
      'url',
      'type',
      'subtype',
      'countryCodes',
      'createdAt',
      'updatedAt',
    ]
  }

  static schema(operation = 'get') {
    if (!['get', 'create'].includes(operation)) {
      throw new Error('Invalid schema operation.')
    }

    if (operation === 'create') {
      return Joi.object().keys({
        name: Joi.string().required(),
        value: Joi.string().required(),
        source: Joi.string().optional().allow(null).allow(''),
        date: Joi.string().optional().allow(null).allow(''),
        deletedDate: Joi.string().optional().allow(null).allow(''),
        url: Joi.string().optional().allow(null).allow(''),
        type: Joi.string().required(),
        subtype: Joi.string().required().allow(null).allow(''),
        countryCodes: Joi.array().optional().items(Joi.string()).default([]),
      })
    }

    return Joi.object().keys({
      id: Joi.string().uuid(),
    })
  }
}

module.exports = SignerComplianceVerificationListEntryModel
