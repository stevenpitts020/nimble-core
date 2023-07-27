const _ = require('lodash')
const app = require('../../../core')
const UnauthorizedError = require('../../../errors/unauthorized')

const User = app.models.user
const Roles = User.roles()
const branches = app.services.branch
const serializer = app.serializers.v1.branch

const logger = app.logger.getLogger('app.controllers.v1.institition_branch.list')

function list(req, res, next) {
  const me = req.user
  if (!me) return next(new UnauthorizedError('UserRequired'))

  const hasRole = role => User.hasRole(me, role)

  const isSuperAdmin = hasRole(Roles.SuperAdmin)

  if (!me.institutionId && !isSuperAdmin) return next(new UnauthorizedError('InstitutionRequired'))

  const filters = _.merge(_.pick(req.query, 'sort', 'limit', 'offset', 'search'), {
    institutionId: isSuperAdmin ? null : me.institutionId
  })

  logger.info({ filters })

  return branches.list(filters)
    .then(branches => branches.map(serializer))
    .then(branches => res.status(200).json(branches))
    .catch(next)
}

module.exports = list
