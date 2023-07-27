const app = require('../../../core')
const UnauthorizedError = require('../../../errors/unauthorized')

const User = app.models.user
const Roles = User.roles()
const users = app.services.user
const serializer = app.serializers.v1.userAccount

const logger = app.logger.getLogger('app.controllers.v1.user_account.get')

function get(req, res, next) {
  const user = req.user
  if (!user) return next(new UnauthorizedError('UserRequired'))

  const id = req.params.id
  if (!id) return next(new UnauthorizedError('IdRequired'))

  const hasRole = role => User.hasRole(user, role)

  const isSuperAdmin = hasRole(Roles.SuperAdmin)

  if (!user.branchId && !isSuperAdmin) return next(new UnauthorizedError('BranchRequired'))
  if (!user.institutionId && !isSuperAdmin) return next(new UnauthorizedError('InstitutionRequired'))

  const example = {
    id,
    branchId: isSuperAdmin || hasRole(Roles.InstitutionAdmin) ? null : user.branchId,
    institutionId: isSuperAdmin ? null : user.institutionId
  }

  logger.info({ example })

  return users.findOneByExample(example)
    .then(serializer)
    .then(user => res.status(200).json(user))
    .catch(next)
}

module.exports = get
