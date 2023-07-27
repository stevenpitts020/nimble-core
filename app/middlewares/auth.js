const _ = require('lodash')
const Joi = require('@hapi/joi')
const app = require('../core')
const UnauthorizedError = require('../errors/unauthorized')
const UnauthorizedTokenError = require('../errors/unauthorized_token')
const ForbiddenError = require('../errors/forbidden')
const User = require('../models/user')
const Statuses = User.statuses()

function getToken(headers) {
  if (
    _.has(headers, 'authorization') &&
    headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    return headers.authorization.split('Bearer ').pop()
  }
  throw new Error('no JWT token found')
}

function getApiKey(headers) {
  if (_.has(headers, 'x-api-key')) {
    return _.get(headers, 'x-api-key')
  }

  throw new UnauthorizedError()
}

function getQueryOrHeaderToken(params, headers) {
  if (_.has(params, 'token')) {
    return params.token
  }

  if (_.has(headers, 'authorization')
    && headers.authorization.split(' ')[0] === 'Bearer') {
    return headers.authorization.split('Bearer ').pop()
  }

  throw new UnauthorizedTokenError()
}

async function checkJWTrequestToken(req, res, next) {
  try {
    let token = getToken(req.headers)
    let payload = app.plugins.jwt.decode(token)
    let user = await app.services.user.get(payload.userId)
    if ([Statuses.Deactivated, Statuses.Suspended].includes(user.status)) return next(new UnauthorizedError(user.status))
    req.isAuthenticated = true
    req.user = user
  } catch (err) {
    if (req.isAuthorized) return next() // allowed JWT to be set, but continue because of prior authorization
    return next(new UnauthorizedTokenError('Invalid token: ' + err.message))
  }

  next()
}

async function checkRoles(roles, req, res, next) {
  if (req.isAuthorized) return next() // already authorized
  if (!req.isAuthenticated) return next(new UnauthorizedTokenError('Roles require authentication'))
  if (!req.user) return next(new UnauthorizedTokenError('Roles require authentication'))
  if (User.isSuperAdmin(req.user)) return next() // super-admin is always permitted
  if (_.isEmpty(roles)) return next() // no role required
  if (_.isEmpty(req.user.roles)) return next(new UnauthorizedTokenError('Unauthorized:0'))
  for (const role of roles) { if (_.includes(req.user.roles, role)) return next() }
  next(new UnauthorizedTokenError('Unauthorized:1'))
}

async function checkMemberships(memberships, req, res, next) {
  if (req.isAuthorized) return next() // already authorized
  if (!req.isAuthenticated) return next(new UnauthorizedTokenError('Memberships require authentication'))
  if (!req.user) return next(new UnauthorizedTokenError('Memberships require authentication'))
  if (User.isSuperAdmin(req.user)) return next() // super-admin is always permitted
  if (_.isEmpty(memberships)) return next(new UnauthorizedTokenError('Unauthorized:0')) // membership can't be verified

  let atLeastOne = false

  if (memberships.institution) {
    if (req.user.institutionId !== req.params[memberships.institution]) return next(new UnauthorizedTokenError('Unauthorized:Institution'))
    atLeastOne = true
  }

  if (memberships.branch) {
    if (req.user.branchId !== req.params[memberships.branch]) return next(new UnauthorizedTokenError('Unauthorized:Branch'))
    atLeastOne = true
  }

  next(atLeastOne ? undefined : new UnauthorizedTokenError('Unauthorized:0'))
}

async function checkApiKey(req, res, next) {
  if (req.isAuthenticated && req.user && User.isSuperAdmin(req.user)) {
    req.isAuthorized = true
    return next()
  }

  try {
    const apiKey = getApiKey(req.headers)
    if (apiKey != app.config.get('auth').adminApiKey) {
      return next(new UnauthorizedError())
    }

    req.isAuthenticated = true
    req.isAuthorized = true
  } catch (err) {
    return next(new UnauthorizedError())
  }
  next()
}

function checkScopeToken(scopes, req, res, next) {
  try {
    const token = getQueryOrHeaderToken(req.query, req.headers)
    const payload = app.plugins.jwt.decode(token)

    if (payload.userId) { // if this is not a scoped token, and is in fact a backoffice allaround token, we should skip this auth strategy
      return next(new UnauthorizedTokenError())
    }

    // the target of the requests can be either params.id or any ID in the post body that matches the `score + Id`
    // we build an array with possible matches, then see if they exists on the body
    const bodyScopeIds = scopes
      .map(str => _.singularize(_.camelCase(str)) + 'Id') // identify every key
      .map(key => _.get(req, `body.${key}`, null)) // see if it exists in the current req.body

    const targetId = [_.get(req, 'params.id', null)] // route ID takes precedence
      .concat(bodyScopeIds) // concat body.somethingId as possibilities
      .find(key => key !== null) // get first not null

    if (targetId === null) { // if we cant identify a targetID, this token is void
      return next(new UnauthorizedTokenError())
    }

    // if the id present on the url is not a GUID we should return Unauthorized and skip the rest of the authentication
    const { error } = Joi.object({ id: Joi.string().uuid() }).validate({ id: targetId })
    if (error) {
      return next(new UnauthorizedTokenError())
    }

    // flatMap all the allowed scopes against token scopes
    // we want to check if the token scores are included in the allowed scopes INCLUDING sub resource scopres
    // this will help us check tokens with [signer.something] and [signers] against the allowed scope [signers]
    const scopeChecks = _.flatMap(scopes, allowedScope => {
      return payload.scopes.map(payloadScope => {
        return (allowedScope === payloadScope) // eihter we check for signer.something === signer.something
          || (allowedScope.split(".").shift() === payloadScope) // or signer[.something] === signer
      })
    })

    // if all of the checks above return false, we fail the token
    if (scopeChecks.filter(r => r === true).length === 0) {
      return next(new ForbiddenError())
    }

    // here we will draw a flat map with all resouces the token will have access too
    // this will allow tokens with signer#1234 to access endpoints with [singer.something] in the scope
    // by spliting by "." and using the first half
    const ids = _.flatMap(scopes, allowedScope => {
      const splitedScope = allowedScope.split(".")
      if (splitedScope.length === 1) {
        return allowedScope
      } else {
        return [splitedScope[0], allowedScope]
      }
    }).map(s => `${s}#${targetId}`)

    // if the token does not have a resouce that matches the array above, we fail it
    if (_.intersection(payload.resources, ids).length == 0) {
      return next(new ForbiddenError())
    }

  } catch (err) {
    return next(new UnauthorizedTokenError())
  }

  req.checkedScopeToken = true
  next()
}

function checkTokenOrJWT(scopes, req, res, next) {
  return checkScopeToken(scopes, req, res, (err) => {
    if (err) {
      if (err instanceof ForbiddenError) {
        return next(err)
      }

      return checkJWTrequestToken(req, res, next)
    } else {
      next()
    }
  })
}

function checkApiKeyOrJwt(req, res, next) {
  return checkApiKey(req, res, err => err ? checkJWTrequestToken(req, res, next) : next())
}

module.exports = function authMiddleware(strategy, options) {
  strategy = _.toString(strategy)
  const strategies = {
    'tokenOrJwt': _.partial(checkTokenOrJWT, options),
    'token': _.partial(checkScopeToken, options),
    'apiKey': checkApiKey,
    '': checkJWTrequestToken,
    'jwt': checkJWTrequestToken,
    'apiKeyOrJwt': checkApiKeyOrJwt,
    'roles': _.partial(checkRoles, options),
    'memberships': _.partial(checkMemberships, options)
  }

  const fn = strategies[strategy]
  if (!fn) {
    throw Error('Invalid authentication strategy')
  }
  return fn
}
