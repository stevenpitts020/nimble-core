const _ = require('lodash')
const app = require('../../../core')
const UnauthorizedError = require('../../../errors/unauthorized')

const users = app.services.user
const serializer = app.serializers.v1.user

const logger = app.logger.getLogger('app.controllers.v1.referrers.list')

function list(req, res, next) {
  if (!req.user) return next(new UnauthorizedError('UserRequired'))
  if (!req.user.institutionId) return next(UnauthorizedError('InstitutionRequired'))

  const filters = _.merge(_.pick(req.query, 'sort'), {
    unlimited: true,
    branchId: null,
    institutionId: req.user.institutionId,
    status: 'ACTIVE'
  })

  logger.info({ filters })

  return users
    .list(filters)
    .then(users => users.map(serializer))
    .then(users => res.status(200).json(users))
    .catch(next)
}

module.exports = list
