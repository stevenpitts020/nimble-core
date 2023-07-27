const axios = require('axios')
const nock = require('nock')
const mocks = require('../../../support/mock/docusign')
const config = require('../../../../config')
const { expect } = require('chai')
axios.defaults.adapter = require('axios/lib/adapters/http')

describe('app.services.contract.update', () => {
  describe('send', async () => {

    it('should exist as a method', ()=>{
      expect(app.services.contract).to.have.ownProperty('update')
      expect(app.services.contract.send).to.be.an('Function')
    })

    describe('when passing information to docusign', () => {
      let docusignSend = null
      let accountRequestId = "2552ab85-08da-4bb5-be00-9e94d282d348"

      before(() => {
        docusignSend = sinon.replace(app.plugins.docusign, 'updateEnvelopeRecipients', sinon.fake.returns(Promise.resolve()))
        nock.disableNetConnect()
        nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
      })

      beforeEach(async () => {
        await seed.institution.create() // required by seed.account_request_products
        await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
        await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d310')
        await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d340') // required by seed.account_request_products
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.document.create()
        await seed.accountRequest.create(accountRequestId)
        await seed.accountRequest.create('17ba2033-1c12-463b-bbc7-72deed747ae7') // required by seed.account_request_products
        await seed.account_request_products() // insert all
        await seed.account_request_product_options() // insert all
        await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
        await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454721')
        await seed.docusignTemplate.create()
      })

      afterEach(() => {
        sinon.reset()
        nock.cleanAll()
      })

      after(() => {
        sinon.restore()
        nock.enableNetConnect()
      })

      it('should call with correct arguments', async () => {

        await app.services.contract.update('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
        const args = {
          accountRequestId: accountRequestId,
          accountOptions: mocks.mockSendContractArgs.accountOptions,
          signers: mocks.mockSendContractArgs.signerData // this should actually be an array of signers
        }
        const calledArgs = docusignSend.firstCall.firstArg

        // check contract data
        expect(calledArgs.accountRequestId).to.equal(args.accountRequestId)
        expect(calledArgs.accountOptions.institutionName).to.equal(args.accountOptions.institutionName)
        expect(calledArgs.accountOptions.openingAmount).to.equal(args.accountOptions.openingAmount)
        expect(calledArgs.accountOptions.productName).to.equal(args.accountOptions.productName)

        expect(calledArgs.signers[0].id).to.equal(args.signers[0].id)
        expect(calledArgs.signers[1].id).to.equal(args.signers[1].id)

        // check if envelopeId is passed
        expect(docusignSend.firstCall.args[1]).to.equal('5d715751-e027-45e4-884b-99bb85c357dc')
        expect(docusignSend).to.have.been.calledOnce
      })

      it('should throw error if cannot access envelope', async () => {
        try {
          await app.services.contract.update('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
        } catch (error) {
          expect(error.name).to.equal('PreConditionFailedError')
          expect(error.statusCode).to.equal(412)
          expect(error.message).to.equal("We could not send the document with Docusign. Please contact support.")
        }
      })
    })

    describe('when updating an account request', () => {
      let accountRequestId = "2552ab85-08da-4bb5-be00-9e94d282d348"

      beforeEach(async () => {
        nock.disableNetConnect()
        nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)

        await seed.institution.create() // required by seed.account_request_products
        await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
        await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d310')
        await seed.product.create('3552ab85-08da-4bb5-be00-9e94d282d340') // required by seed.account_request_products
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
        await seed.document.create()
        await seed.accountRequest.create(accountRequestId)
        await seed.accountRequest.create('17ba2033-1c12-463b-bbc7-72deed747ae7') // required by seed.account_request_products
        await seed.account_request_products() // insert all
        await seed.account_request_product_options() // insert all
        await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
        await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454721')
        await knex('account_requests').update('status', 'PENDING').where('id', accountRequestId)
        await seed.docusignTemplate.create()
      })

      afterEach(() => { nock.cleanAll() })

      it('return true when finished', async () => {
        // get sign in
        const scope1 = nock("https://"+config.get('docusign').oauthPath).post('/oauth/token').reply(200, mocks.mockToken)

        // mock template
        const envelopeId = '5d715751-e027-45e4-884b-99bb85c357dc'
        const recipientId = '1'
        const scope2 = nock(app.config.get('docusign').basePath)
          .get(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients/${recipientId}/tabs`)
          .reply(200, mocks.mockTemplateTabs)

        const scope3 = nock(app.config.get('docusign').basePath)
          .put(`/v2.1/accounts/${config.get('docusign').accountID}/envelopes/${envelopeId}/recipients`)
          .reply(200, mocks.mockUpdateRecipients)

        const result = await app.services.contract.update('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
        expect(result).not.to.be.undefined
        expect(result).to.equal(true)

        scope1.done()
        scope2.done()
        scope3.done()
      })
    })
  })
})
