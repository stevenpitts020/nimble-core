const sinon = require('sinon')
const fakePostmark = require('../../../support/mock/postmark')
const emailPlugin = require('../../../../app/plugins/email')
const { uuid } = require('uuidv4')
const config = require('../../../../config')

describe('app.services.email.emailVerification', () => {
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
    it('should return error if signerId is not a uuid', async() => {
      const id = 'asdsd'
      const expectedErrorMsg = '"id" must be a valid GUID'
      return expect(app.services.email.emailVerification(id)).to.be.rejectedWith(expectedErrorMsg)
    })

    it('should return error if signer not found', async() => {
      const id = uuid()
      const expectedErrorMsg = 'The requested resource couldn\'t be found'
      return expect(app.services.email.emailVerification(id)).to.be.rejectedWith(expectedErrorMsg)
    })
  })

  describe('when calling with valid data', () => {
    beforeEach(async() => {
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

      await knex('signer_email_verifications').insert({
        id: '2e31d8c0-0000-0000-0000-4bd8aa454722',
        signer_id: '2e31d8c0-1226-4651-8a5d-4bd8aa454722'
      })
    })

    const id = '2e31d8c0-0000-0000-0000-4bd8aa454722'

    it('should exist', () => {
      expect(app.services.email.emailVerification).not.to.be.undefined
    })

    it('should call sendEmailTemplate', async() => {
      await app.services.email.emailVerification(id)
      expect(plugin.aws.sendEmailTemplate).to.have.been.calledOnce
    })

    it('should call send with correct data', async() => {
      const signer = blueprints.signers.signer_1

      const emailData = {
        email: signer.email,
        signerEmail: signer.email,
        signerFirstName: signer.firstName,
        institution: 'Singular',
        institutionUrl: 'wearesingular.com',
        statusEmailSubject: 'Confirm your email address'
      }

      emailData.verifyUrl = config.get('frontend.signerEmailVerificationURI')
        .replace(':protocol', config.get('protocol'))
        .replace(':onboarding_domain', config.get('frontend.onboarding_domain'))
        .replace(':domain', 'wearesingular.com')
        .replace(':signer_id', signer.id)
        .replace(':id', id)
        .replace(':token', 'xxxx')
      const template = 'signerEmailVerificationEmail'

      await app.services.email.emailVerification(id)

      const expectedCall = [template, emailData.email, undefined, emailData]
      expect(emailData.verifyUrl).to.equal(`${config.get('protocol')}://${config.get('frontend.onboarding_domain')}/wearesingular.com/email-verification/2e31d8c0-1226-4651-8a5d-4bd8aa454722/2e31d8c0-0000-0000-0000-4bd8aa454722?token=xxxx`)
      return expect(plugin.aws.sendEmailTemplate).to.have.been.calledWith(...expectedCall)
    })

    it('should default to first part of email if signer does not have a first name', async() => {
      const signer = blueprints.signers.signer_1

      await knex.raw('UPDATE signers SET first_name=null, email=\'this.will.be.the.name@domain.com\'')

      const emailData = {
        email: 'this.will.be.the.name@domain.com',
        signerEmail: 'this.will.be.the.name@domain.com',
        signerFirstName: 'this.will.be.the.name',
        institution: 'Singular',
        institutionUrl: 'wearesingular.com',
        statusEmailSubject: 'Confirm your email address'
      }

      emailData.verifyUrl = config.get('frontend.signerEmailVerificationURI')
        .replace(':protocol', config.get('protocol'))
        .replace(':onboarding_domain', config.get('frontend.onboarding_domain'))
        .replace(':domain', 'wearesingular.com')
        .replace(':signer_id', signer.id)
        .replace(':id', id)
        .replace(':token', 'xxxx')
      const template = 'signerEmailVerificationEmail'

      await app.services.email.emailVerification(id)

      const expectedCall = [template, 'this.will.be.the.name@domain.com', undefined, emailData]
      expect(emailData.verifyUrl).to.equal(`${config.get('protocol')}://${config.get('frontend.onboarding_domain')}/wearesingular.com/email-verification/2e31d8c0-1226-4651-8a5d-4bd8aa454722/2e31d8c0-0000-0000-0000-4bd8aa454722?token=xxxx`)
      return expect(plugin.aws.sendEmailTemplate).to.have.been.calledWith(...expectedCall)
    })

    describe('when the signer does not have email verified', () => {
      beforeEach(async() => {
        await knex('signers').update('email_verified', false).where('id', id)
      })

      it('should call sendEmailTemplate anyway', async() => {
        await app.services.email.emailVerification(id)
        expect(plugin.aws.sendEmailTemplate).to.have.been.called
      })
    })
  })
})
