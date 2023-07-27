const app = require('../../core')
const Joi = require('@hapi/joi')
const NotImplementedError = require('../../errors/not_implemented')
const validator = app.plugins.validator

const SCHEMAS = {
  method: Joi.string().required().valid('email', 'push', 'sms'),

  email: Joi.object().keys({
    method: Joi.string().required().valid('email'),
    product: Joi.string().optional(),
    recipient: Joi.object().keys({
      name: Joi.string().optional(),
      email: Joi.string().email().required()
    }),
    cc: Joi.string().email().optional(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    html: Joi.string().optional(),
    my: Joi.object().optional()
  }),

  sms: Joi.object().keys({
    method: Joi.string().required().valid('sms'),
    product: Joi.string().optional(),
    recipient: Joi.object().keys({
      name: Joi.string().optional(),
      mobile: Joi.string().required()
    }),
    message: Joi.string().required(),
    my: Joi.object().optional()
  }),

  push: Joi.object().keys({
    method: Joi.string().required().valid('push'),
    product: Joi.string().optional(),
    recipient: Joi.object().keys({
      id: Joi.string().required(),
      name: Joi.string().optional()
    }),
    title: Joi.string().optional(),
    message: Joi.string().required(),
    my: Joi.object().optional()
  })
}

module.exports = async notification => {
  await validator(notification.method, SCHEMAS.method)
  await validator(notification, SCHEMAS[notification.method], { abortEarly: false })
  return await SENDERS[notification.method](notification)
}

const SENDERS = {
  email: async(notification) => {
    return await app.plugins.email.notify(notification)
  },
  sms: async(notification) => {
    return await app.plugins.sms.notify(notification)
  },
  push: async(notification) => {
    throw new NotImplementedError(`NotImplemented: notification.push(${notification})`)
  }
}
