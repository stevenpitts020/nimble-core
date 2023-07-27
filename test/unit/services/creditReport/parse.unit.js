
const axios = require('axios')
const nock = require('nock')
const mocks = require('../../../support/mock/credit_report')
const creditReportPlugin = require('../../../../app/plugins/credit_report')

axios.defaults.adapter = require('axios/lib/adapters/http')

describe('app.services.creditReport.parse', () => {
  afterEach(() => { nock.cleanAll() })

  beforeEach(async () => {
    nock.disableNetConnect()
    nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)

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


  describe('when validating', () => {
    it('should return error if response is invalid', async () => {
      const response = {}
      const scope = nock(creditReportPlugin._apiURL())
        .post(/prequal_results/)
        .reply(200, response)

      try {
        const id = '111'
        await app.services.creditReport.parse(id)

      } catch (error) {
        expect(error.message).to.equal("Response from Credit Bureau is empty")
        expect(error).to.be.an.instanceof(Error)
      }
      scope.done()
    })
  })

  describe('when calling with valid data', () => {
    it('should exist', () => {
      expect(app.services.creditReport.parse).not.to.be.undefined
    })

    it('return valid score, url and updated at timestamp', async () => {
      const response = mocks.resultsSuccess
      const scope = nock(creditReportPlugin._apiURL())
        .post(/prequal_results/)
        .reply(200, response)

      const { url, score, updatedAt } = await app.services.creditReport.parse('0000')
      scope.done()
      expect(url).to.equal('https://secure.prequalsolutions.com/preq/api/viewReport.php?id=227031&t=1611685783&sc=0466566d0d4e99ea9886593ccd6ef1b4e6227e40214e240c901c1d519a70a2ee')
      expect(score).to.equal(767)
      expect(updatedAt).to.equal('2021-01-26T17:54:39.000Z')
    })

    it('should return error if error parsing data', async () => {
      const response = [
        {
          "consumerid": "227031",
          "report_url": "https://secure.prequalsolutions.com/preq/api/viewReport.php?id=227031&t=1611685783&sc=0466566d0d4e99ea9886593ccd6ef1b4e6227e40214e240c901c1d519a70a2ee",
          "report_xml": '<NetConnectResponse xmlns="http://www.experian.com/NetConnectResponse"></NetConnectResponse>'
        }
      ]

      const scope = nock(creditReportPlugin._apiURL())
        .post(/prequal_results/)
        .reply(200, response)

      try {
        const id = '111'
        await app.services.creditReport.parse(id)

      } catch (error) {
        expect(error.message).to.equal("Error parsing XML from Credit Bureau")
        expect(error).to.be.an.instanceof(Error)
      }
      scope.done()
    })
  })
})
