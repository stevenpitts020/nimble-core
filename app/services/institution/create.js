const _ = require('lodash')
const uuid = require('uuid')

const app = require('../../core')
const ConflictError = require('../../errors/conflict')
const Institution = app.repositories.institution
const InstitutionModel = app.models.institution
const validator = app.plugins.validator
const logger = app.logger.getLogger('app.services.institution.create')

const whitelist = InstitutionModel.props()

async function validate(entity) {
  let data = _.pick(entity, whitelist)
  validator(data, InstitutionModel.schema('create'), { abortEarly: false })
  return data
}

async function create(payload, tx = app.db) {
  logger.debug(payload, '[create] started with payload')
  // convert to slug to id
  payload = _.defaults(_.omit(payload, 'id'), { slug: payload.id })
  const data = await validate(payload)

  let entity = await app.services.institution.get({ domain: data.domain }, tx).catch(() => null)
  if (entity) { throw new ConflictError() }

  const id = await tx.transaction(async tx => {
    const newData = _.omit(data, ['logo', 'backgroundImage'])
    const newInstitution = await Institution.forge({
      ...newData,
      logoUri: '', // prevents not-null constraint
      backgroundImageUri: '', // prevents not-null constraint
    }).save(null, { method: 'insert', transacting: tx })
    const newInstitutionId = newInstitution.get('id')

    // upload images
    logger.debug(data, `[create] uploading images for institution [${newInstitutionId}]`)
    const newLogo = await app.plugins.aws.s3ImgUpload(data.logo, newInstitutionId, uuid.v4(), 'public-read')
    const newBackground = await app.plugins.aws.s3ImgUpload(data.backgroundImage, newInstitutionId, uuid.v4(), 'public-read')

    // updates with image uploads
    await Institution.forge({ id: newInstitutionId }).save({
      logoUri: newLogo,
      backgroundImageUri: newBackground,
    }, { method: 'update', transacting: tx })

    return newInstitutionId
  })

  return await app.services.institution.get({ id }, tx)
}

module.exports = create
