const sinon = require('sinon')
const fakePostmark = require('../../../support/mock/postmark')
const emailPlugin = require('../../../../app/plugins/email')
const { uuid } = require('uuidv4')
const config = require('../../../../config')

describe('app.services.email.inviteSigner', () => {
  // re-instanciate the class with a fake postmark service
  // const plugin = new target.constructor(fakePostmark)
  const plugin = new emailPlugin.constructor(fakePostmark)
  let clock = null

  before(() => {
    clock = sinon.useFakeTimers({ toFake: ['Date'] })
    sinon.spy(plugin.aws, 'sendEmailTemplate')
    sinon.spy(plugin.aws.ses, 'sendTemplatedEmail')
    sinon.replace(app.services.token, 'get', () => 'xxxx')
  })

  beforeEach(() => {
    plugin.service.sendEmailWithTemplate.resetHistory()
    sinon.reset()
  })

  after(() => {
    clock.restore()
    sinon.restore()
  })

  describe('when validating', () => {
    it('should return error if signerId is not a uuid', async () => {
      const id = 'asdsd'
      const expectedErrorMsg = '"id" must be a valid GUID'
      return expect(app.services.email.inviteSigner(id)).to.be.rejectedWith(expectedErrorMsg)
    })

    it('should return error if signer not found', async () => {
      const id = uuid()
      const expectedErrorMsg = "The requested resource couldn't be found"
      return expect(app.services.email.inviteSigner(id)).to.be.rejectedWith(expectedErrorMsg)
    })
  })

  describe('when calling with valid data', () => {
    beforeEach(async () => {
      await seed.institution.create()
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
      await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d310')
      await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d340') // required by seed.account_request_products
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.document.create()
      await seed.accountRequest.create('2552ab85-08da-4bb5-be00-9e94d282d348')
      await seed.accountRequest.create('17ba2033-1c12-463b-bbc7-72deed747ae7') // required by seed.account_request_products
      await seed.account_request_products() // insert all
      await seed.account_request_product_options() // insert all
      await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
      await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454721')
    })

    const id = '2e31d8c0-1226-4651-8a5d-4bd8aa454722'

    it('should exist', () => {
      expect(app.services.email.inviteSigner).not.to.be.undefined
    })

    it('should call sendEmailTemplate', async () => {
      await app.services.email.inviteSigner(id)
      expect(plugin.aws.sendEmailTemplate).to.have.been.calledOnce
    })

    it('should call send with correct data', async () => {
      const invitedSigner = blueprints.signers.signer_1
      const institution = blueprints.institutions.institution_1
      const invitedBy = blueprints.signers.signer_1
      const product = blueprints.products.product_10

      const emailData = {
        inviteeName: 'example',
        invitedByFirstName: invitedBy.firstName,
        invitedByFullName: `${invitedBy.firstName} ${invitedBy.lastName}`,
        accountType: product.name,
        email: invitedSigner.email,
        inviteeRole: invitedSigner.role.toLowerCase(),
        institution: institution.name,
        institutionUrl: institution.domain,
        statusEmailSubject: `${invitedBy.firstName} has invited you to join ${institution.name}`,
      }

      emailData.url = config.get('frontend.inviteeOnboardingURI')
        .replace(':protocol', config.get('protocol'))
        .replace(':onboarding_domain', config.get('frontend.onboarding_domain'))
        .replace(':prospect_id', '2552ab85-08da-4bb5-be00-9e94d282d348')
        .replace(':signer_id', id)
        .replace(':invitedBy', invitedBy.firstName)
        .replace(':token', 'xxxx')
        .replace(':domain', institution.domain)

      const template = 'inviteeSignupEmail'

      await app.services.email.inviteSigner(id)

      const expectedCall = [template, emailData.email, undefined, emailData]
      return expect(plugin.aws.sendEmailTemplate).to.have.been.calledWith(...expectedCall)
    })

    it('should update the invitedAt property', async () => {
      let beforeSigner = await knex('signers').where('id', id).first()
      await app.services.email.inviteSigner(id)
      let afterSigner = await knex('signers').where('id', id).first()

      expect(afterSigner.invited_at.toISOString()).not.to.equal(beforeSigner.invited_at.toISOString())
      expect(afterSigner.invited_at.toISOString()).to.equal('1970-01-01T00:00:00.000Z')
    })
  })
})
