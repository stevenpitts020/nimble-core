const Joi = require('@hapi/joi')
const BaseModel = require('./model')

class Application extends BaseModel {
  constructor(data) {
    super(Application.props(), Application.relations(), data)
  }

  static props() {
    return ['id','applicantId', 'status', 'session','createdAt','updatedAt']
  }

  static schema() {
    return Joi.object().keys({
      id: Joi.string().uuid(),
      applicantId: Joi.string().required(),
      status: Joi.string().required(),
      session: Joi.string().required()
    })
  }
}

module.exports = Application
