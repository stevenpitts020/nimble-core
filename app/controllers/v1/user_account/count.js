const app = require('../../../core')
const UnauthorizedError = require('../../../errors/unauthorized')
const service = app.services.user
const serializer = app.serializers.v1.count
const User = app.models.user
const Roles = User.roles()
const _ = require('lodash')

function count(req, res, next) {
  const me = req.user
  if (!me) return next(new UnauthorizedError('UserRequired'))

  const hasRole = role => User.hasRole(me, role)

  const isSuperAdmin = hasRole(Roles.SuperAdmin)

  if (!me.branchId && !isSuperAdmin) return next(new UnauthorizedError('BranchRequired'))
  if (!me.institutionId && !isSuperAdmin) return next(new UnauthorizedError('InstitutionRequired'))

  const filters = _.merge(_.pick(req.query, 'search', 'branch'), {
    branchId: isSuperAdmin || hasRole(Roles.InstitutionAdmin) ? null : me.branchId,
    institutionId: isSuperAdmin ? null : me.institutionId
  })

  return service
    .count(filters)
    .then(serializer)
    .then(data => res.status(200).json(data))
    .catch(next)
}

module.exports = count
