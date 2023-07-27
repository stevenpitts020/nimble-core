const _ = require('lodash')
const app = require('../../core')
const File = app.repositories.file
const FileModel = app.models.file
const validator = app.plugins.validator
const BadRequestError = require('../../errors/bad_request')
const logger = app.logger.getLogger('app.services.file.create')

/**
 * data: {
 *   originalname: string
 *   mimetype: string
 *   createdById: string
 *   createdByRole: [user, applicant]
 *   bytes?: string (base64-bytes)
 *   buffer?: Buffer
 *   size: number
 * }
 */
async function create(data, tx = app.db) {
  if (!data.buffer && !data.bytes) throw new BadRequestError('body.buffer || body.bytes (base64-bytes) required')

  const buffer = data.buffer ? data.buffer : (data.bytes ? Buffer.from(data.bytes, 'base64') : null)

  if (!buffer || !Buffer.isBuffer(buffer)) throw new BadRequestError('body.buffer || body.bytes provided but malformed')

  if (!data.size) data.size = Buffer.byteLength(buffer)

  // TODO: validate data has all the information that `putFile` will not provide to prevent post s3 failure

  const res = await app.plugins.aws.putFile(data, `${data.createdByRole}/${data.createdById}`)

  logger.info({ phase: 'file.create.s3:success', res })

  try {
    data = _.merge(data, res)

    const model = validator(_.pick(data, FileModel.props('create')), FileModel.schema('create'), { abortEarly: false })

    const entity = await File.forge(model).save(null, { method: 'insert', transacting: tx })

    logger.info({ phase: 'file.create.entity:success', entity })

    return await app.services.file.get(entity.get('id'), tx)
  } catch(err) {
    logger.error(err, { phase: 'file.create.entity:fail', data })
    await app.plugins.aws.deleteFile(data).catch(logger.error)
  }
}

module.exports = create
