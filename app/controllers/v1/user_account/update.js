const _ = require('lodash')
const app = require('../../../core')

const User = app.models.user
const Roles = User.roles()
const users = app.services.user
const serializer = app.serializers.v1.userAccount
const BadRequestError = require('../../../errors/bad_request')
const { NotFoundError } = require('bookshelf/lib/errors')

async function update(req, res, next) {
  const me = req.user
  const patch = req.body

  if (!_.isObject(patch) || _.isEmpty(patch)) return next(new BadRequestError('UserBodyRequired'))

  if (patch.id && patch.id !== req.params.id) return next(new BadRequestError('PathIdBodyIdMismatch'))

  patch.id = req.params.id

  const user = await users.get(patch.id)
  if (!user) return next(new NotFoundError(`user[${patch.id}]`))

  if (!User.isSuperAdmin(me)) {
    delete patch['institutionId'] // only super-admin can set an institution

    if (!User.isInstitutionAdmin(me)) delete user['branchId'] // only institution-admin+ can set the branch

    if (User.isSubordinate(me, user)) delete patch['roles'] // subordinate users cannot update roles of a superior

    if (!_.isEmpty(patch.roles)) {

      // an institution-admin can set the institution-admin, branch-admin and employee role
      if (User.isInstitutionAdmin(me)) patch['roles'] = _.intersection(patch.roles, [Roles.InstitutionAdmin, Roles.BranchAdmin, Roles.Employee])

      // a branch-admin can set the branch-admin and employee role
      else if (User.isBranchAdmin(me)) patch['roles'] = _.intersection(patch.roles, [Roles.BranchAdmin, Roles.Employee])

      // non-admins cannot set roles
      else delete patch['roles']
    }
  }

  return users.patch(patch)
    .then(serializer)
    .then(user => res.status(200).json(user))
    .catch(next)
}

module.exports = update
