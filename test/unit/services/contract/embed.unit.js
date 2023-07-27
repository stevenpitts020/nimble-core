const axios = require('axios')
const nock = require('nock')
axios.defaults.adapter = require('axios/lib/adapters/http')

describe('app.services.contract.embed', () => {
  describe('embed', async () => {

    it('should exist as a method', ()=>{
      expect(app.services.contract).to.have.ownProperty('embed')
      expect(app.services.contract.embed).to.be.an('Function')
    })

    describe('when creating a embed view with docusign', () => {
      let docusignEmbed = null
      let accountRequestId = "2552ab85-08da-4bb5-be00-9e94d282d348"
      let signerId = "2e31d8c0-1226-4651-8a5d-4bd8aa454722"
      before(() => {
        docusignEmbed = sinon.replace(app.plugins.docusign, 'createRecipientView', sinon.fake.returns(Promise.resolve()))
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
        await seed.signer.create(signerId)
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
        await knex('account_requests').update('status', 'PENDING').where('id', accountRequestId)

        await app.services.contract.embed(signerId)

        const calledArgs = docusignEmbed.firstCall.args
        expect(calledArgs[0]).to.equal('5d715751-e027-45e4-884b-99bb85c357dc') // copied from account request seed
        expect(calledArgs[1].id).to.equal(signerId)
        expect(calledArgs[2]).to.equal('wearesingular.com')
        expect(docusignEmbed).to.have.been.calledOnce
      })

      it('should throw error if cannot find signer', async () => {
        await knex('account_requests').update('status', 'PENDING').where('id', accountRequestId)

        try {
          await app.services.contract.embed(accountRequestId)
          expect(false).to.equal(true) // should not reach here
        } catch (error) {
          expect(error.name).to.equal('NotFoundError')
          expect(error.statusCode).to.equal(404)
          expect(error.message).to.equal("The requested resource couldn't be found")
        }
      })
    })

  })
})
