const Joi = require('@hapi/joi')
const BaseModel = require('./model')

class SignerCreditReportModel extends BaseModel {
  constructor(data) {
    super(SignerCreditReportModel.props(), SignerCreditReportModel.relations(), data)
  }

  static props() {
    return [
      'id',
      'errorCode',
      'reference',
      'score',
      'reportDate',
      'documentId',
      'signerId',
      'createdAt',
      'updatedAt'
    ]
  }

  static schema(operation = 'get') {
    if (!['get', 'create'].includes(operation)) {
      throw new Error('Invalid schema operation.')
    }

    if (operation === 'create') {
      return Joi.object().keys({
        errorCode: Joi.string().allow(null),
        reference: Joi.string().required(),
        score: Joi.number().positive().allow(0).default(null).allow(null),
        reportDate: Joi.date().optional().allow(null),
        documentId: Joi.string().uuid().optional().allow(null),
        signerId: Joi.string().uuid().required(),
      })
    }

    // for get we only need id
    return Joi.object().keys({
      id: Joi.string().uuid()
    })
  }
}

module.exports = SignerCreditReportModel
