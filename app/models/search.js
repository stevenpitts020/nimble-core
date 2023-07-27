const Joi = require('@hapi/joi')
const BaseModel = require('./model')
const _ = require('lodash')

class SearchModel extends BaseModel {
  constructor(data) {
    super(SearchModel.props(['all']), SearchModel.relations(), data)
  }

  static props(op) {
    return {
      all: [
        // app meta
        'id',
        'institutionId',
        'createdById',
        'createdAt',
        'updatedAt',

        //info
        'name',
        'description',
        'filters',
        'query'
      ],

      create: [
        // app meta
        'id',
        'institutionId',
        'createdById',

        //info
        'name',
        'description',
        'filters',
        'query'
      ],

      update: [
        'id',
        'institutionId',
        'name',
        'description',
        'filters',
        'query'
      ],

      delete: [
        'id',
        'institutionId',
        'createdById'
      ]
    }[op]
  }

  static schema(op) {
    return {
      delete: Joi.object().keys({
        id: Joi.string().pattern(/^\w+$/).optional(),
        institutionId: Joi.string().uuid().optional(),
        createdById: Joi.string().uuid().optional()
      }),

      create: Joi.object().keys({
        id: Joi.string().pattern(/^\w+$/).required(),
        institutionId: Joi.string().uuid().required(),
        createdById: Joi.string().uuid().required(),
        name: Joi.string().required(),
        description: Joi.string().optional(),
        query: Joi.object().required(),
        filters: Joi.array().items(Joi.object()).required()
      }),

      update: Joi.object().keys({
        id: Joi.string().pattern(/^\w+$/).required(),
        institutionId: Joi.string().uuid().required(),
        name: Joi.string().optional(),
        description: Joi.string().optional(),
        query: Joi.object().optional(),
        filters: Joi.array().items(Joi.object()).optional()
      })
    }[op]
  }

  static prePersist(search) {
    return !search ? null : _.merge(search, search.filters ? { filters: JSON.stringify(search.filters) } : {})
  }
}

module.exports = SearchModel
