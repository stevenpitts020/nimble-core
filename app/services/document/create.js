const _ = require('lodash')
const app = require('../../core')
const { uuid } = require('uuidv4')
const validator = app.plugins.validator
const Document = app.repositories.document
const Model = app.models.document
const logger = app.logger.getLogger('app.services.document.create')

async function create(entity, options = {}) {
  logger.debug(`[create] starting for institution id ${entity.institutionId}`)

  entity = validator(entity, Model.schema('create'), { abortEarly: false })

  const id = await app.db.transaction(async tx => {
    const newId = uuid()
    const key = app.plugins.aws.getKey(entity.institutionId, entity.content, newId, entity.format)
    const data = { ..._.omit(entity, 'content', 'institutionId'), key, id: newId }

    const model = await Document.forge(data)
      .save(null, { method: 'insert', transacting: tx })

    if (entity.format == 'image') {
      await app.plugins.aws.s3ImgUpload(entity.content, entity.institutionId, model.id)
    } else {
      const buffer = new Buffer.from(entity.content, 'base64')
      await app.plugins.aws.s3Upload(entity.institutionId, model.id, "pdf", buffer, null, options)
    }

    return model.get('id')
  })

  return await app.services.document.get({ id })
}

module.exports = create
