const Joi = require('@hapi/joi')

const BaseModel = require('./model')
const app = require('../core')
const User = app.repositories.user

class UserAuthModel extends BaseModel {
  constructor(data) {
    super(UserAuthModel.props(), UserAuthModel.relations(), data)
  }

  static props() {
    return ['email', 'password']
  }

  static schema() {
    return Joi.object().keys({
      email: Joi.string().email({ tlds: { allow: false } }).required(),
      password: Joi.string().max(160).required()
    })
  }

  static async getLocalAccountByEmail(email, tx = app.db) {
    return User.query(q => {
      q.select([
        'users.id as user_id',
        'accounts.id as account_id',
        'users.email',
        'users.failed_login_attempts',
        'accounts.secret'
      ])
        .innerJoin('accounts', 'accounts.user_id', '=', 'users.id')
        .where('users.email', email)
        .where('accounts.strategy', '=', 'local')
        .limit(1)
    }).fetch({ transacting: tx })
  }
}

module.exports = UserAuthModel
