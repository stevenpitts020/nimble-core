const Joi = require('@hapi/joi')
const BaseModel = require('./model')
const app = require('../core')
const _ = require('lodash')

class SignerComplianceVerificationModel extends BaseModel {
  constructor(data) {
    super(SignerComplianceVerificationModel.props(), SignerComplianceVerificationModel.relations(), data)
  }

  static props() {
    return [
      'id',
      'status',
      'searchId',
      'documentId',
      'searchObject',
      'reference',
      'signerId',
      'createdAt',
      'updatedAt',
    ]
  }

  static relations() {
    return ['results']
  }

  data() {
    const SignerComplianceVerificationItemModel = app.models.signerComplianceVerificationItem
    return {
      ..._.omit(this._data, 'results'),
      results: this._data.results.map(resultData => new SignerComplianceVerificationItemModel(resultData).data()),
    }
  }

  static schema(operation = 'get') {
    const SignerComplianceVerificationItemModel = app.models.signerComplianceVerificationItem

    if (!['get', 'create'].includes(operation)) {
      throw new Error('Invalid schema operation.')
    }

    if (operation === 'create') {
      return Joi.object().keys({
        signerId: Joi.string().uuid().required(),
        searchId: Joi.string().required(),
        documentId: Joi.string().uuid().required(),
        status: Joi.string().required(),
        reference: Joi.string().required(),
        searchObject: Joi.any(),
        results: Joi.array().items(SignerComplianceVerificationItemModel.schema('create')).min(0).default([])
      })
    }

    return Joi.object().keys({
      id: Joi.string().uuid()
    })
  }
}

module.exports = SignerComplianceVerificationModel
