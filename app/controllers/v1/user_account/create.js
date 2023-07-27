const _ = require('lodash')
const app = require('../../../core')

const User = app.models.user
const Roles = User.roles()
const Statuses = User.statuses()
const users = app.services.user
const serializer = app.serializers.v1.userAccount
const BadRequestError = require('../../../errors/bad_request')

async function create(req, res, next) {
  const me = req.user
  const user = req.body

  if (!_.isObject(user)) return next(new BadRequestError('UserBodyRequired'))

  if (!User.hasRole(me, Roles.SuperAdmin)) {
    delete user['institutionId'] // only super-admin can set an institution

    if (!User.hasRole(me, Roles.InstitutionAdmin)) delete user['branchId'] // only institution-admin+ can set the branch

    // an institution-admin can set the branch-admin and employee role
    if (!_.isEmpty(user.roles) && User.hasRole(me, Roles.InstitutionAdmin)) {
      user['roles'] = _.intersection(user.roles, [Roles.BranchAdmin, Roles.Employee])
    } else delete user['roles'] // neither a super/institution-admin, cannot set roles
  }

  if (!user.status) user['status'] = Statuses.Active
  if (!user.branchId) user['branchId'] = me.branchId
  if (!user.institutionId) user['institutionId'] = me.institutionId
  if (_.isEmpty(user.roles)) user['roles'] = [Roles.Employee]

  return users.register(user, 'local', false)
    .then(serializer)
    .then(user => res.status(201).json(user))
    .catch(next)
}

module.exports = create
