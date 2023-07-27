const app = require('../../core')
const _ = require('lodash')
const Joi = require('@hapi/joi')
const DocusignTemplate = app.repositories.docusignTemplate
const InternalServerError = require('../../errors/internal_server')
const { validator } = app.plugins
const logger = app.logger.getLogger('app.services.docusign_template.fetch')

const schema = function () {
  return Joi.object().keys({
    version: Joi.number().required(),
    institutionId: Joi.string().uuid().required(),
  })
}

async function fetch(options = {}, tx = app.db) {
  logger.debug(`[fetch] starting for institution id ${options.institutionId} and version ${options.version}`)
  const data = validator(options, schema(), { abortEarly: false })

  return tx.transaction(async (tx) => {
    // find the oldest available number for this institution
    const model = await DocusignTemplate.query(q => {
      q.where('institution_id', data.institutionId)
      q.where('version', data.version)
    }).fetchAll({ transacting: tx })

    // if we cant find an available number, reject the transaction
    if (!model) {
      throw new InternalServerError('An error has occured, please contact support with the following code: no-docusign-templates-available')
    }

    // map the model
    // [{name: 'Funds available', templateId: 'xpto'}, ...repeat ]
    const dbDocusignTemplates = model.models.map(row => {
      const data = _.pick(row.toJSON(), ['name', 'templateId'], null)
      return data
    })

    // {'Funds available': 'xpto', 'other template': 'xpto2' }
    const dbDocusignTemplatesFlattened = _.chain(dbDocusignTemplates)
      .keyBy('name')
      .mapValues('templateId')
      .value()

      return dbDocusignTemplatesFlattened
  })

}

module.exports = fetch
