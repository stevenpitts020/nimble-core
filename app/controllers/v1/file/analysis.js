const _ = require('lodash')
const app = require('../../../core')
const files = app.services.file
const User = app.models.user
const BadRequestError = require('../../../errors/bad_request')
const UnauthorizedError = require('../../../errors/unauthorized')
const NotFoundError = require('../../../errors/not_found')

async function analysis(req, res) {
  const me = req.user
  const id = req.params.id

  if (!id) throw new BadRequestError('file `id` required')

  const query = _.merge({id}, User.isBranchAdmin(me) ? {} : {createdById: me.id})

  const tx = app.db

  const file = await files.get(query, tx)

  if (!file) throw new new NotFoundError(`file[${id}]`)

  if (me.id !== file.createdById && !User.isSuperAdmin(me)) {
    const createdBy = await app.services.user.get(file.createdById, tx)

    let access = false

    if (User.isInstitutionAdmin(me) && me.institutionId === createdBy.institutionId) access = true

    if (!access && User.isBranchAdmin(me) && me.branchId === createdBy.branchId) access = true

    if (!access) throw new UnauthorizedError(`file[${id}]`)
  }

  const analysis = await files.analysis(file, _.get(req, 'query.processor') || 'table/financial-statement', tx)

  res.status(200)

  const ext = _.get(req, 'query.ext', 'json').toLowerCase()

  if (/^([tT][eE][xX][tT]\/)?[cC][sS][vV]$/.test(ext)) return res.type('text/csv').send(csv(analysis))

  res.status(200).json(analysis)
}

function csv(analysis) {
  throw new BadRequestError(`text/csv not implemented ${JSON.stringify(analysis)}`)
}

module.exports = analysis
