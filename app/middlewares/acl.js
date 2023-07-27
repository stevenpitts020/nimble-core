const _ = require('lodash')
const app = require('../core')
const Joi = require('@hapi/joi')
const NotFoundError = require('../errors/not_found')
const validator = app.plugins.validator

const AccountRequestModel = app.repositories.accountRequest
const SignerModel = app.repositories.signer
const logger = app.logger.getLogger('app.middlwares.acl')

const RESOURCES = {
  'signer': {
    check: 'institutionId',
    schema: Joi.object({ id: Joi.string().uuid() }),
    matches: {
      model: SignerModel,
      key: 'institutionId'
    }
  },
  'account_request': {
    check: 'institutionId',
    schema: Joi.object({ id: Joi.string().uuid() }),
    matches: {
      model: AccountRequestModel,
      key: 'institutionId'
    }
  }
}

function acl(resource, param) {

  // generate acl middleware
  return async function (req, res, next) {
    const targetId = _.get(req.params, param, '') // the ID we are targeting
    const checkBy = _.get(RESOURCES, resource, null) // the parameters
    if (!checkBy) { // abort
      return next(new NotFoundError())
    }

    if (req.checkedScopeToken) {
      return next() // if the scoped token was checked, we dont need to apply an ACL
    }

    const checkValue = _.get(req.user, checkBy.check) // the user value we are going to check
    logger.debug('[acl] check for user:', _.get(req.user, 'id'), 'on', resource, 'using param:', targetId)


    // validate schema
    if (_.has(checkBy, 'schema')) {
      try {
        // will throw if validation failts
        validator({ [param]: targetId }, checkBy.schema, { abortEarly: false })
      } catch (err) {
        next(err) // forward the error
      }
    }

    // try to spawn a model
    const target = await new checkBy.matches.model({ id: targetId }).fetch()

    // assign the desired filter to the request handler
    req.filters = { [checkBy.matches.key]: targetId }

    // check if the model[checkBy.matches.key] matches the value from checkBy.value
    if (target && target.get(checkBy.matches.key) === checkValue) {
      return next()
    }

    return next(new NotFoundError())
  }
}


module.exports = acl
