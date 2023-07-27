const _ = require('lodash')
const app = require('../../../core')

const User = app.models.user
const Roles = User.roles()
const branches = app.services.branch
const institutionbranches = app.services.institutionBranch
const serializer = app.serializers.v1.institutionBranch
const BadRequestError = require('../../../errors/bad_request')
const UnauthorizedError = require('../../../errors/unauthorized')
const { NotFoundError } = require('bookshelf/lib/errors')

async function update(req, res, next) {
  const me = req.user
  const patch = req.body

  if (!_.isObject(patch) || _.isEmpty(patch)) return next(new BadRequestError('UserBodyRequired'))

  if (patch.id && patch.id !== req.params.id) return next(new BadRequestError('PathIdBodyIdMismatch'))

  patch.id = req.params.id

  const branch = await institutionbranches.get(patch.id)
  if (!branch) return next(new NotFoundError(`user[${patch.id}]`))

  const hasRole = role => User.hasRole(me, role)

  const isSuperAdmin = hasRole(Roles.SuperAdmin)

  if (!me.institutionId && !isSuperAdmin) return next(new UnauthorizedError('InstitutionRequired'))

  if (!isSuperAdmin && branch.institutionId !== me.institutionId) return next(new UnauthorizedError('InstitutionInvalid'))

  return branches.patch(patch)
    .then(serializer)
    .then(branch => res.status(200).json(branch))
    .catch(next)
}

module.exports = update
