const app = require('../../core')
const Roles = app.models.user.roles()
const admins = [Roles.SuperAdmin, Roles.InstitutionAdmin, Roles.BranchAdmin]
const auth = app.middlewares.auth
const multer = require('multer')
const upload = multer()
const logger = app.logger.getLogger('app.controllers.v1.routes')

function asyncWrapper(cb) {
  return (req, res, next) => cb(req, res, next).catch(next)
}

module.exports = function routerDecorator(router) {
  router.get('/', app.controllers.v1.health.get) // alias for v1/health
  router.get('/v1/health', app.controllers.v1.health.get)

  //AUTH
  router.post('/v1/auth/login', app.controllers.v1.auth.login)
  router.post('/v1/auth/recover/:email', app.controllers.v1.auth.recover)
  router.put('/v1/auth/recover/:email', app.controllers.v1.auth.changePassword)
  router.post('/v1/auth/magic-link', app.controllers.v1.auth.magicLink)
  router.post('/v1/auth/login/:email', app.controllers.v1.auth.loginOneTimeToken)
  router.post('/v1/auth/verify-code', app.controllers.v1.auth.verifyCode)

  // router.post('/v1/auth/send-verify-code', app.controllers.v1.auth.sendVerifyCode)
  // router.post('/v1/auth/verify-user-code', app.controllers.v1.auth.verifyUserCode)

  router.post('/v1/auth/auth-tokens', app.controllers.v1.applicantAuthToken.create)

  //DOCUMENTS
  router.post('/v1/documents', asyncWrapper(app.controllers.v1.document.create))
  router.get('/v1/documents/:id', app.middlewares.auth('token', ['documents']), asyncWrapper(app.controllers.v1.document.get))

  //ME
  router.get('/v1/me', app.middlewares.auth(), app.controllers.v1.me.get)
  router.put('/v1/me', app.middlewares.auth(), app.controllers.v1.me.update)

  //USER[types]
  // app-tier specialization of `GET /users` for those users who can referrer other account/product/feature types
  router.get('/v1/referrers', app.middlewares.auth(), app.controllers.v1.referrers.list)
  router.get('/v1/user-accounts', app.middlewares.auth(), app.middlewares.auth('roles', admins), app.controllers.v1.userAccount.list)
  router.get('/v1/user-accounts/count', app.middlewares.auth(), app.middlewares.auth('roles', admins), app.controllers.v1.userAccount.count)
  router.get('/v1/user-accounts/:id', app.middlewares.auth(), app.middlewares.auth('roles', admins), app.controllers.v1.userAccount.get)
  router.patch('/v1/user-accounts/:id', app.middlewares.auth(), app.middlewares.auth('roles', admins), app.controllers.v1.userAccount.update)
  router.post('/v1/user-accounts', app.middlewares.auth(), app.middlewares.auth('roles', admins), asyncWrapper(app.controllers.v1.userAccount.create))

  //USERS
  router.get('/v1/users/:id', app.middlewares.auth('apiKey'), app.controllers.v1.user.get)
  router.get('/v1/users', app.middlewares.auth('apiKey'), app.controllers.v1.user.list)
  router.post('/v1/users', app.middlewares.auth('apiKey'), asyncWrapper(app.controllers.v1.user.create))

  //INSTITUTION
  router.get('/v1/institutions/count', app.middlewares.auth(), app.middlewares.auth('roles', [Roles.SuperAdmin]), app.controllers.v1.institution.count)
  router.get('/v1/institutions/:domain', app.controllers.v1.institution.get)
  router.get('/v1/institutions/:id/branches', app.controllers.v1.institutionBranch.list)
  router.post('/v1/institutions/:id/branches', auth('apiKeyOrJwt'), auth('roles', [Roles.SuperAdmin, Roles.InstitutionAdmin]), auth('memberships', { institution: 'id' }), app.controllers.v1.institutionBranch.create)
  router.post('/v1/institutions', app.middlewares.auth('apiKey'), asyncWrapper(app.controllers.v1.institution.create))
  router.get('/v1/institutions', app.middlewares.auth(), app.middlewares.auth('roles', [Roles.SuperAdmin]), app.controllers.v1.institution.list)
  router.put('/v1/institutions/:id', auth('jwt'), auth('roles', [Roles.SuperAdmin, Roles.InstitutionAdmin]), auth('memberships', { institution: 'id' }), app.controllers.v1.institution.update)
  router.patch('/v1/institutions/:id', auth('jwt'), auth('roles', [Roles.SuperAdmin, Roles.InstitutionAdmin]), auth('memberships', { institution: 'id' }), app.controllers.v1.institution.update)

  // (INSTITUTION) BRANCHES
  router.get('/v1/branches/count', app.middlewares.auth(), app.middlewares.auth('roles', [Roles.SuperAdmin, Roles.InstitutionAdmin]), app.controllers.v1.branch.count)
  router.get('/v1/branches', app.middlewares.auth(), app.middlewares.auth('roles', [Roles.SuperAdmin, Roles.InstitutionAdmin]), app.controllers.v1.branch.list)
  router.patch('/v1/branches/:id', app.middlewares.auth(), app.middlewares.auth('roles', [Roles.SuperAdmin, Roles.InstitutionAdmin]), app.controllers.v1.branch.update)

  //PRODUCTS
  router.get('/v1/institutions/:id/products', app.controllers.v1.product.list)
  router.post('/v1/institutions/:id/products', app.middlewares.auth('apiKey'), asyncWrapper(app.controllers.v1.product.create))

  //PRODUCT FORMS
  router.get('/v1/product_forms/:productName/prefill_form', app.controllers.v1.productForms.prefillForm)

  //SIGNERS
  router.get('/v1/signers/:id', app.middlewares.auth('tokenOrJwt', ['signers']), app.middlewares.acl('signer', 'id'), asyncWrapper(app.controllers.v1.signer.get))
  router.post('/v1/signers', app.middlewares.auth('token', ['account_requests']), asyncWrapper(app.controllers.v1.signer.create))
  router.post('/v1/signers/:id/validate', asyncWrapper(app.controllers.v1.signer.validate))
  router.put('/v1/signers/:id', app.middlewares.auth('token', ['signers']), app.middlewares.acl('signer', 'id'), asyncWrapper(app.controllers.v1.signer.update))
  router.get('/v1/signers/:id/contract', app.middlewares.auth('token', ['signers']), asyncWrapper(app.controllers.v1.signerContract.get))
  router.post('/v1/signers/:id/invites', app.middlewares.auth(), app.middlewares.acl('signer', 'id'), asyncWrapper(app.controllers.v1.signer.invite))

  //SIGNER VERIFICATIONS
  router.get('/v1/signers/:id/identity-verifications', app.middlewares.auth(), app.middlewares.acl('signer', 'id'), asyncWrapper(app.controllers.v1.signerIdentityVerifications.get))
  router.get('/v1/signers/:id/compliance-verifications', app.middlewares.auth(), app.middlewares.acl('signer', 'id'), asyncWrapper(app.controllers.v1.signerComplianceVerifications.get))
  router.get('/v1/signers/:id/credit-reports', app.middlewares.auth(), app.middlewares.acl('signer', 'id'), asyncWrapper(app.controllers.v1.signerCreditReport.list))

  router.post('/v1/signers/:id/email-verifications', app.middlewares.auth('tokenOrJwt', ['signers.email_verifications']), app.middlewares.acl('signer', 'id'), asyncWrapper(app.controllers.v1.signerEmailVerifications.post))
  router.put('/v1/signers/:id/email-verifications/:emailVerificationId', app.middlewares.auth('token', ['signers.email_verifications']), asyncWrapper(app.controllers.v1.signerEmailVerifications.update))

  //ACCOUNT REQUEST
  router.get('/v1/account-requests/count', app.middlewares.auth(), app.controllers.v1.accountRequest.count)
  router.get('/v1/account-requests/:id', app.middlewares.auth('tokenOrJwt', ['account_requests']), app.middlewares.acl('account_request', 'id'), app.controllers.v1.accountRequest.get)
  router.put('/v1/account-requests/:id', app.middlewares.auth('tokenOrJwt', ['account_requests']), app.middlewares.acl('account_request', 'id'), app.controllers.v1.accountRequest.update)
  router.patch('/v1/account-requests/:id', app.middlewares.auth('tokenOrJwt', ['account_requests']), app.middlewares.acl('account_request', 'id'), app.controllers.v1.accountRequest.patch)
  router.post('/v1/account-requests', asyncWrapper(app.controllers.v1.accountRequest.create))
  router.get('/v1/account-requests', app.middlewares.auth(), app.controllers.v1.accountRequest.list)
  router.get('/v1/account-requests/:id/bsa-risk-results', auth(), app.middlewares.acl('account_request', 'id'), asyncWrapper(app.controllers.v1.accountRequestBsaRiskResult.get))
  router.post('/v1/account-requests/:id/bsa-risk-results', auth('token', ['account_requests']), asyncWrapper(app.controllers.v1.accountRequestBsaRiskResult.create))

  //APPLICATION REQUEST
  router.get('/v1/applications', app.middlewares.auth(), app.controllers.v1.application.list)

  // WEBHOOKS
  router.post('/v1/webhooks/docusign/connect/:id/contract/:token', app.controllers.v1.accountRequest.webhook)
  router.post('/v1/webhooks/shufti/identity-verification', asyncWrapper(app.controllers.v1.signerIdentityVerifications.webhook))

  // IDENTITY
  router.get('/v1/prospects/identities/:frontDocId/:backDocId', asyncWrapper(app.controllers.v1.identity.get))

  // NOTIFICATIONS
  router.post('/v1/notifications', auth('apiKeyOrJwt'), app.controllers.v1.notification.create)

  // FILES
  router.post('/v1/file', auth('apiKeyOrJwt'), upload.single('file'), asyncWrapper(app.controllers.v1.file.create))
  router.post('/v1/files', auth('apiKeyOrJwt'), upload.array('files'), asyncWrapper(app.controllers.v1.file.create))
  router.get('/v1/files/:id/analysis', auth('apiKeyOrJwt'), asyncWrapper(app.controllers.v1.file.analysis))
  router.get('/v1/accounting-terms', auth('apiKeyOrJwt'), asyncWrapper(app.controllers.v1.terms.accounting))
  router.get('/v1/accounting-terms/:term', auth('apiKeyOrJwt'), asyncWrapper(app.controllers.v1.terms.accounting))

  // DATA
  router.get('/v1/data/people/schema', auth(), asyncWrapper(app.controllers.v1.data.peopleSchema))
  router.post('/v1/data/people/search', auth(), asyncWrapper(app.controllers.v1.data.peopleSearch))

  router.get('/v1/data/searches', auth(), asyncWrapper(app.controllers.v1.data.searchList))
  router.get('/v1/data/searches/:id', auth(), asyncWrapper(app.controllers.v1.data.searchGet))
  router.delete('/v1/data/searches/:id', auth(), asyncWrapper(app.controllers.v1.data.searchDelete))
  router.post('/v1/data/searches', auth(), asyncWrapper(app.controllers.v1.data.searchCreate))
  router.patch('/v1/data/searches/:id', auth(), asyncWrapper(app.controllers.v1.data.searchUpdate))

  router.get('/v1/data/api', auth(), asyncWrapper(app.controllers.v1.data.api))

  // wkfl
  const _ = require('lodash')
  const axios = require('axios')

  const TINES_API = 'https://quiet-glitter-1118.tines.com/api/v1'
  const TINES_WEBHOOK = 'https://quiet-glitter-1118.tines.com/webhook'
  const TINES_USER_EMAIL = 'erin@nimblefi.com'
  const TINES_USER_TOKEN = 'H9xExi3fxfvZgdsLEz5Z'

  const wkfl = {
    secrets: {
      'document-request': '0f871e8c0d2083e995f11d531a822679'
    }
  }

  router.post('/v1/workflows/:name', auth(), (req, res, next) => {
    const auto = req.params.name
    const secret = wkfl.secrets[auto]
    const url = `${TINES_WEBHOOK}/${auto}/${secret}`

    logger.info({ url, body: req.body })

    axios.post(url, req.body).catch(next).then(_res => {
      res.json(_.get(_res, ['data'], { err: '?' }))
    })
  })

  router.get('/v1/workflow-runs/:id', auth(), (req, res, next) => {
    const runId = req.params.id
    const url = `${TINES_API}/events`

    logger.info({ url })

    axios.get(url, { headers: { 'x-user-email': TINES_USER_EMAIL, 'x-user-token': TINES_USER_TOKEN } }).catch(next).then(_res => {
      const actions = _.map(_.get(_.find(_.get(_res, ['data', 'events'], []), _event => runId === _.get(_event, 'story_run_guid')), 'payload', {}), (v, action) => {
        return { key: action, status: _.isNil(v) || _.isEmpty(v) ? 'WAITING' : 'COMPLETED' }
      })

      logger.info({ actions })

      res.json({ id: runId, actions })
    })
  })
}
