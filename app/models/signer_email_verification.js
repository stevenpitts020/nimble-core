const Joi = require('@hapi/joi')
const BaseModel = require('./model')

class SignerEmailVerification extends BaseModel {

  constructor(data) {
    super(SignerEmailVerification.props(), SignerEmailVerification.relations(), data)
  }

  static props() {
    return [
      'id',
      'signerId',
      'createdAt',
      'expiresAt',
      'consumedAt',
    ]
  }

  static relations() {
    return ['signer']
  }

  static schema(operation = 'create') {
    if (operation === 'get') {
      return Joi.object().keys({
        id: Joi.string().uuid().required(),
      })
    }

    if (operation === 'create') {
      return Joi.object().keys({
        signerId: Joi.string().uuid().required(),
      })
    }

    if (operation === 'update') {
      return Joi.object().keys({
        id: Joi.string().uuid().required(),
        signerId: Joi.string().uuid().required(),
      })
    }

    throw new Error('Invalid schema operation.')
  }

}

module.exports = SignerEmailVerification
