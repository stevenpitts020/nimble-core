const _ = require('lodash')
const app = require('../../../core')
const UnauthorizedError = require('../../../errors/unauthorized')

const User = app.models.user
const Roles = User.roles()
const users = app.services.user
const serializer = app.serializers.v1.userAccount

const logger = app.logger.getLogger('app.controllers.v1.user_account.list')

function list(req, res, next) {
  const me = req.user
  if (!me) return next(new UnauthorizedError('UserRequired'))

  const hasRole = role => User.hasRole(me, role)

  const isSuperAdmin = hasRole(Roles.SuperAdmin)

  if (!me.branchId && !isSuperAdmin) return next(new UnauthorizedError('BranchRequired'))
  if (!me.institutionId && !isSuperAdmin) return next(new UnauthorizedError('InstitutionRequired'))

  const filters = _.merge(_.pick(req.query, 'sort', 'limit', 'offset', 'search', 'branch'), {
    branchId: isSuperAdmin || hasRole(Roles.InstitutionAdmin) ? null : me.branchId,
    institutionId: isSuperAdmin ? null : me.institutionId
  })

  logger.info({ filters })

  return users.list(filters)
    .then(users => users.map(serializer))
    .then(users => res.status(200).json(users))
    .catch(next)
}

module.exports = list
