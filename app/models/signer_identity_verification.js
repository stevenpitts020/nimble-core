const Joi = require('@hapi/joi')
const BaseModel = require('./model')

class SignerIdentityVerification extends BaseModel {

  constructor(data) {
    super(SignerIdentityVerification.props(), SignerIdentityVerification.relations(), data)
  }

  static props() {
    return [
      'id',
      'signerId',
      'verification',
      'status',
      'createdAt',
      'updatedAt',
    ]
  }

  static relations() {
    return ['signer']
  }

  static schema(operation = 'create') {
    if (operation === 'create') {
      return Joi.object().keys({
        signerId: Joi.string().uuid().required(),
        verification: Joi.string().required(),
        status: Joi.string().required().valid('VALID', 'INVALID', 'PENDING'),
      })
    }

    throw new Error('Invalid schema operation.')
  }

}

module.exports = SignerIdentityVerification
