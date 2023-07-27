const Joi = require('@hapi/joi')
const BaseModel = require('./model')

class FileModel extends BaseModel {
  constructor(data) {
    super(FileModel.props(['all']), FileModel.relations(), data)
  }

  static props(op) {
    return {
      all: [
        // app meta
        'id',
        'createdById',
        'createdByRole',
        'createdAt',
        'updatedAt',

        // location
        'bucket',
        'key',

        // file meta
        'mimetype',
        'size',
        'acl',

        //info
        'name',
        'version'
      ],

      create: [
        'createdById',
        'createdByRole',

        'bucket',
        'key',

        'mimetype',
        'size',
        'acl',

        'name',
        'version'
      ]
    }[op]
  }

  static schema(op) {
    return {
      'create': Joi.object().keys({
        id: Joi.string().uuid(),
        name: Joi.string(),
        createdById: Joi.string().uuid().required(),
        createdByRole: Joi.string().valid('employee', 'applicant').required(),
        bucket: Joi.string().required(),
        key: Joi.string().required(),
        acl: Joi.string().required(),
        size: Joi.number().integer().positive().required(),
        mimetype: Joi.string().required(),
        version: Joi.string()
      })
    }[op]
  }
}

module.exports = FileModel
