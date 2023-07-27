const _ = require('lodash')
const Joi = require('@hapi/joi')
const NotFoundError = require('../errors/not_found')

class BaseModel {
  constructor(properties, relations, data) {
    //basic verifications
    if (!data) {
      throw new NotFoundError()
    }

    const modelData = data.toJSON ? data.toJSON() : data
    this._data = _.pick(modelData, properties)

    relations.forEach(table => {
      if (_.has(modelData, table)) {
        this._data[table] = modelData[table]
      }
    })

    this.props = properties
  }

  data() {
    return this._data
  }

  static props() {
    return []
  }

  static relations() {
    return []
  }

  static schema() {
    return Joi.object().keys({})
  }
}

module.exports = BaseModel
