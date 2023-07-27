const _ = require('lodash')
const Joi = require('@hapi/joi')
const app = require('../../core')

const NotFoundError = require('../../errors/not_found')

const Institution = app.repositories.institution
const InstitutionModel = app.models.institution
const { validator } = app.plugins
const logger = app.logger.getLogger('app.services.institution.get')

const whitelist = ['domain', 'id', 'slug']
const schema = Joi.object()
  .keys({
    id: Joi.string().uuid(),
    domain: Joi.string().hostname(),
    slug: Joi.string()
  })
  .xor('domain', 'id', 'slug')

async function validate(data) {
  validator(data, schema, { abortEarly: false })
  return _.pick(data, whitelist)
}

async function get(options, transacting = app.db) {
  logger.debug(options, '[get] started with options')
  try {
    validate(options)
  } catch(err) {
    logger.info(err, '[get] error institution not found')
    throw new NotFoundError()
  }

  const model = await Institution.forge(_.pick(options, whitelist)).fetch({ transacting })

  return new InstitutionModel(model).data()
}

module.exports = get
