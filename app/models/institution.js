const _ = require('lodash')
const Joi = require('@hapi/joi')
const BaseModel = require('./model')

const app = require('../core')
const Image = app.plugins.image

class InstitutionModel extends BaseModel {
  constructor(data) {
    super(InstitutionModel.props(), InstitutionModel.relations(), data)
  }

  static props() {
    return [
      'id',
      'slug',
      'name',
      'email',
      'domain',
      'templateApprove',
      'templateDecline',
      'routingNumber',
      'logo',
      'backgroundImage',
      'logoUri',
      'backgroundImageUri',
      'publicMetadata',
      'branchesCount',
      'workbook',
      'disclosures',
      'agreements',
      'questions'
    ]
  }

  // overwrite the data() function to compose the {logo} prop
  data() {
    return {
      ..._.omit(this._data, 'logoUri', 'backgroundImageUri'),
      logoUri: Image.cdn(this._data.logoUri),
      backgroundImageUri: Image.cdn(this._data.backgroundImageUri)
    }
  }

  static schema(operation = 'update') {
    if (!['update', 'create'].includes(operation)) {
      throw new Error('Invalid schema operation.')
    }

    return Joi.object().keys({
      slug: Joi.string().required(),
      name: Joi.string().required(),
      domain: Joi.string().domain().required(),
      email: Joi.string().email({ tlds: { allow: false } }).required(),
      logo: Joi.string().required(),
      backgroundImage: Joi.string().required(),
      routingNumber: Joi.string().required(),
      templateApprove: Joi.string().required(),
      templateDecline: Joi.string().required(),
      publicMetadata: Joi.object(),
      workbook: Joi.object(),
      disclosures: Joi.object(),
      agreements: Joi.object(),
      questions: Joi.object().keys({
        count: Joi.number().integer().positive().allow(0).default(0).optional(),
        thresholds: Joi.array().optional().default([]).items(Joi.object()),
        data: Joi.array().default([]).items(Joi.object().keys({
          id: Joi.string().optional(),
          text: Joi.string().required(),
          type: Joi.string().valid('string', 'number', 'boolean', 'date', 'array').required(),
          subtype: Joi.string().valid('enum', 'text', 'country').required(),
          enum: Joi.array().items(Joi.string()).optional(),
          default: Joi.string().optional(),
          score: Joi.object().optional(),
          dependsOn: Joi.object().optional(),
          required: Joi.boolean().default(true).required()
        }))
      })
    })
  }

  static patchSchema() {
    return Joi.object().keys({
      id: Joi.string().uuid().required(),
      slug: Joi.string(),
      name: Joi.string(),
      domain: Joi.string().domain(),
      email: Joi.string().email({ tlds: { allow: false } }),
      logo: Joi.string(),
      backgroundImage: Joi.string(),
      routingNumber: Joi.string(),
      templateApprove: Joi.string(),
      templateDecline: Joi.string(),
      publicMetadata: Joi.object(),
      workbook: Joi.object(),
      disclosures: Joi.object(),
      agreements: Joi.object(),
      questions: Joi.object().keys({
        count: Joi.number().integer().positive().allow(0).default(0).optional(),
        thresholds: Joi.array().optional().default([]).items(Joi.object()),
        data: Joi.array().optional().default([]).items(Joi.object().keys({
          id: Joi.string().optional(),
          text: Joi.string().required().allow(''),
          type: Joi.string().valid('string', 'number', 'boolean', 'date', 'array').required(),
          subtype: Joi.string().valid('enum', 'text', 'country').required(),
          enum: Joi.array().items(Joi.string()).optional(),
          default: Joi.string().optional(),
          score: Joi.object().optional(),
          dependsOn: Joi.object().optional(),
          required: Joi.boolean().default(true).required()
        }))
      })
    })
  }
}

module.exports = InstitutionModel
