const Joi = require('@hapi/joi')
const BaseModel = require('./model')

class ApplicantOneTimeToken extends BaseModel {
  constructor(data) {
    super(ApplicantOneTimeToken.props(), ApplicantOneTimeToken.relations(), data)
  }

  static props() {
    return ['phone', 'hashedVerificationToken', 'salt', 'expiration', 'isAlreadyUsed', 'createdAt']
  }

  static schema() {
    return Joi.object().keys({
      phone: Joi.string().required(),
      hashedVerificationToken: Joi.string().required(),
      salt: Joi.string().required(),
      expiration: Joi.number().required(),
      isAlreadyUsed: Joi.boolean().default(false)
    })
  }
}

module.exports = ApplicantOneTimeToken
