const Joi = require('@hapi/joi')
const app = require("../../core")

const Document = app.repositories.document
const Model = app.models.document
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.document.create')

const schema = Joi.object().keys({ id: Joi.string().uuid().required() })

async function get(filters, tx = app.db) {
  logger.debug(`[get] starting for id ${filters.id}`)

  filters = validator(filters, schema, { abortEarly: false })

  const model = await Document.forge(filters)
    .fetch({ transacting: tx })
  return new Model(model).data()
}

module.exports = get
