const _ = require('lodash')
const app = require('../../../core')
const BadRequestError = require('../../../errors/bad_request')
const User = app.models.user
const service = app.services.file
const serializer = app.serializers.v1.file

/**
 * data: {
 *   originalname: string
 *   mimetype: string
 *   createdById: string
 *   bytes?: string (base64-bytes)
 *   buffer?: Buffer
 * }
 *
 * FIXME: handle a single file buffer, multiple file buffers, and a single base64 byte array
 */
async function create(req, res) {
  if (!req.files || _.isEmpty(req.files)) throw new BadRequestError('require multi-part form data in input: `files`')

  const file = req.files[0]

  const entity = await service.create({
    ...file,
    name: file.name || file.originalname || file.filename || '',
    createdById: req.user.id,
    createdByRole: User.isApplicant(req.user) ? 'applicant' : 'employee'
  })

  res.status(201)

  const ext = _.get(req, 'query.ext', 'json').toLowerCase()

  if (/^[tT][eE]?[xX][tT]$/.test(ext)) return res.type('text/plain').send(entity.id)

  res.json(serializer(entity))
}

module.exports = create
