const Joi = require('@hapi/joi')
const BaseModel = require('./model')

class AccountOneTimeTokenModel extends BaseModel {
  constructor(data) {
    super(AccountOneTimeTokenModel.props(), AccountOneTimeTokenModel.relations(), data)
  }

  static props() {
    return ['userId', 'scopes', 'resources', 'expiration', "phone", 'createdAt']
  }

  static schema() {
    return Joi.object().keys({
      userId: Joi.string().optional().default(null),
      scopes: Joi.array().items(Joi.string()).min(1).default(['*']),
      resources: Joi.array().items(Joi.string()).min(1).default(['*']),
      expiration: Joi.number().positive().default(900),
      phone: Joi.string().optional()
    })
  }
}

module.exports = AccountOneTimeTokenModel
