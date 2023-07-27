const sinon = require('sinon')
const fakePostmark = require('../../../support/mock/postmark')
const config = require('../../../../config')
const emailPlugin = require('../../../../app/plugins/email')
const moment = require('moment')

describe('app.services.email.welcome', () => {
  // re-instanciate the class with a fake postmark service
  // const plugin = new target.constructor(fakePostmark)
  const plugin = new emailPlugin.constructor(fakePostmark)
  let clock = null

  before(() => {
    clock = sinon.useFakeTimers({ toFake: ['Date'] })
    sinon.spy(plugin.aws, 'sendEmailTemplate')
    sinon.spy(plugin.aws.ses, 'sendTemplatedEmail')
    const fakeGenerateRecoveryCode = sinon.fake.returns('XXXXX')
    sinon.replace(app.plugins.random, 'generateRecoveryCode', fakeGenerateRecoveryCode)
  })

  beforeEach(() => {
    plugin.service.sendEmailWithTemplate.resetHistory()
    sinon.reset()
  })

  after(() => {
    clock.restore()
    sinon.restore()
  })

  describe('with validations', () => {
    it('should return error if userId is not a uuid', async() => {
      try {
        await app.services.email.welcome('xpto')
      } catch(error) {
        expect(error.name).to.equal('BadRequestError')
        expect(error.statusCode).to.equal(400)
      }
    })

    it('should return error if user not found', async() => {
      try {
        await app.services.email.welcome('2552ab85-08da-4bb5-be00-9e94d282d311')
      } catch(error) {
        expect(error.name).to.equal('NotFoundError')
        expect(error.statusCode).to.equal(404)
      }
    })
  })

  describe('sendWelcomeEmail()', () => {
    beforeEach(async() => {
      // create a user
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
    })

    it('should exist', () => {
      expect(app.services.email.welcome).not.to.be.undefined
    })

    it('should call send', async() => {
      await app.services.email.welcome('1052ab85-08da-4bb5-be00-9e94d282d310')
      expect(plugin.aws.sendEmailTemplate).to.have.been.calledOnce
    })

    it('should call send with correct data', async() => {
      const user = blueprints.me.get('1052ab85-08da-4bb5-be00-9e94d282d310')

      const email = user.email
      const firstName = user.firstName
      const lastName = user.lastName
      const template = 'welcomeEmail'
      const statusEmailSubject = 'You have been added to Singular Nimble Account'
      const code = 'XXXXX'
      const institution = 'Singular'
      const institutionUrl = 'wearesingular.com'
      const uri = config.get('frontend.welcome_uri')
        .replace(':protocol', config.get('protocol'))
        .replace(':onboarding_domain', config.get('frontend.onboarding_domain'))
        .replace(':email', email)
        .replace(':code', code)
        .replace(':expiresAt', moment().add(1, 'day').toISOString())

      await app.services.email.welcome(user.id)

      const expectedCall = [template, email, undefined, {
        email,
        firstName,
        lastName,
        statusEmailSubject,
        uri,
        institution,
        institutionUrl
      }]
      expect(plugin.aws.sendEmailTemplate).to.have.been.calledWith(...expectedCall)
    })
  })
})
