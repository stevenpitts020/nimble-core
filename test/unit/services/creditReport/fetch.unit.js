const sinon = require('sinon')
const axios = require('axios')
const nock = require('nock')
const mocks = require('../../../support/mock/credit_report')
const creditReportPlugin = require('../../../../app/plugins/credit_report')
const { successResponse } = require('../../../support/mock/html2pdf/response')

axios.defaults.adapter = require('axios/lib/adapters/http')

describe('app.services.creditReport.fetch', () => {
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
    it('should not fetch report if signer is invited', async () => {
      const id = '2e31d8c0-1226-4651-8a5d-4bd8aa454722'
      await knex.raw("UPDATE signers SET status='INVITED'")

      const fakeResponseDownload = sinon.fake.returns({ data: Buffer.from('0000') })
      const fakeAwsS3uploadFn = sinon.fake.returns(Promise.resolve(true))
      const fakeAwsLambda = sinon.fake.returns(successResponse)


      expect(app.services.creditReport.fetch(id)).not.to.be.rejectedWith()
      expect(fakeResponseDownload).not.to.have.been.called
      expect(fakeAwsS3uploadFn).not.to.have.been.called
      expect(fakeAwsLambda).not.to.have.been.called
    })

    it('should not fetch report if signer is incomplete', async () => {
      const id = '2e31d8c0-1226-4651-8a5d-4bd8aa454722'
      await knex.raw("UPDATE signers SET status='INCOMPLETE'")

      const fakeResponseDownload = sinon.fake.returns({ data: Buffer.from('0000') })
      const fakeAwsS3uploadFn = sinon.fake.returns(Promise.resolve(true))
      const fakeAwsLambda = sinon.fake.returns(successResponse)


      expect(app.services.creditReport.fetch(id)).not.to.be.rejectedWith()
      expect(fakeResponseDownload).not.to.have.been.called
      expect(fakeAwsS3uploadFn).not.to.have.been.called
      expect(fakeAwsLambda).not.to.have.been.called
    })

    it('should return error if signer not found', async () => {
      const id = '2e31d8c0-0000-4651-8a5d-4bd8aa454721'
      const expectedErrorMsg = "The requested resource couldn't be found"
      return expect(app.services.creditReport.fetch(id)).to.be.rejectedWith(expectedErrorMsg)
    })
  })

  describe('when calling with valid data', () => {
    afterEach(() => sinon.restore())

    it('should exist', () => {
      expect(app.services.creditReport.fetch).not.to.be.undefined
    })

    it('should return error if response is invalid', async () => {
      const response = {
        prequal: {}
      }
      const scope = nock(creditReportPlugin._apiURL())
        .post(/process_applicant/)
        .reply(200, response)

      try {
        const signerId = '2e31d8c0-1226-4651-8a5d-4bd8aa454722'
        await app.services.creditReport.fetch(signerId)

      } catch (error) {
        expect(error.message).to.equal("[fetch] response from Credit Bureau is empty")
        expect(error).to.be.an.instanceof(Error)
      }
      scope.done()
    })

    it('should create a valid credit report', async () => {
      const reportURL = 'https://secure.prequalsolutions.com/preq/api/viewReport.php?id=227031&t=1611685783&sc=0466566d0d4e99ea9886593ccd6ef1b4e6227e40214e240c901c1d519a70a2ee'

      const signerId = '2e31d8c0-1226-4651-8a5d-4bd8aa454722'
      // fake API Call
      const scope1 = nock(creditReportPlugin._apiURL())
        .post(/process_applicant/)
        .reply(200, mocks.processApplicantSuccess)
      const scope2 = nock(creditReportPlugin._apiURL())
        .post(/prequal_results/)
        .reply(200, mocks.resultsSuccess)

      // fake s3 calls
      const fakeResponseDownload = sinon.fake.returns({ data: Buffer.from('0000') })
      const fakeAwsS3uploadFn = sinon.fake.returns(Promise.resolve(true))
      const fakeAwsLambda = sinon.fake.returns(successResponse)

      sinon.replace(app.plugins.aws, 'invokeLambda', fakeAwsLambda)
      sinon.replace(creditReportPlugin, '_downloadReport', fakeResponseDownload)
      sinon.replace(app.plugins.aws, 's3Upload', fakeAwsS3uploadFn)

      await app.services.creditReport.fetch(signerId)
      scope1.done()
      scope2.done()

      // expect pdf upload
      expect(fakeResponseDownload).to.have.been.calledWith(reportURL)
      expect(fakeAwsS3uploadFn).to.have.been.calledOnce
      expect(fakeAwsLambda).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signer_credit_reports order by created_at DESC`)

      expect(result.rows[0].score).to.equal(767)
      expect(result.rows[0].document_id).not.to.equal('0000')
      expect(result.rows[0].error_code).to.equal(null)
      expect(result.rows[0].signer_id).to.equal(signerId)
    })

    it('should create a valid credit report of score 0', async () => {
      const reportURL = 'https://secure.prequalsolutions.com/preq/api/viewReport.php?id=188278&t=1603885023&sc=896410fd9450d10c1547559fad90d69d320393793af4be6ef3052557949b0a84'

      const signerId = '2e31d8c0-1226-4651-8a5d-4bd8aa454722'
      // fake API Call
      const scope1 = nock(creditReportPlugin._apiURL())
        .post(/process_applicant/)
        .reply(200, mocks.processApplicantSuccess)
      const scope2 = nock(creditReportPlugin._apiURL())
        .post(/prequal_results/)
        .reply(200, mocks.resultsNoScore)

      // fake s3 calls
      const fakeResponseDownload = sinon.fake.returns({ data: Buffer.from('0000') })
      const fakeAwsS3uploadFn = sinon.fake.returns(Promise.resolve(true))
      const fakeAwsLambda = sinon.fake.returns(successResponse)

      sinon.replace(creditReportPlugin, '_downloadReport', fakeResponseDownload)
      sinon.replace(app.plugins.aws, 's3Upload', fakeAwsS3uploadFn)
      sinon.replace(app.plugins.aws, 'invokeLambda', fakeAwsLambda)

      await app.services.creditReport.fetch(signerId)
      scope1.done()
      scope2.done()

      // expect pdf upload
      expect(fakeResponseDownload).to.have.been.calledWith(reportURL)
      expect(fakeAwsS3uploadFn).to.have.been.calledOnce
      expect(fakeAwsLambda).to.have.been.calledOnce

      const result = await knex.raw(`SELECT * FROM signer_credit_reports order by created_at DESC`)

      expect(result.rows[0].score).to.equal(0)
      expect(result.rows[0].document_id).not.to.equal('000')
      expect(result.rows[0].error_code).to.equal(null)
      expect(result.rows[0].signer_id).to.equal(signerId)
    })

    it('should create valid credit report with no result', async () => {
      const signerId = '2e31d8c0-1226-4651-8a5d-4bd8aa454722'
      // fake API Call
      const scope1 = nock(creditReportPlugin._apiURL())
        .post(/process_applicant/)
        .reply(200, mocks.processApplicantFailed)

      // fake s3 calls
      const fakeResponseDownload = sinon.fake.returns({ data: Buffer.from('0000') })
      const fakeAwsS3uploadFn = sinon.fake.returns(Promise.resolve(true))
      sinon.replace(creditReportPlugin, '_downloadReport', fakeResponseDownload)
      sinon.replace(app.plugins.aws, 's3Upload', fakeAwsS3uploadFn)

      await app.services.creditReport.fetch(signerId)
      scope1.done()

      // do not download anyhing
      expect(fakeResponseDownload).not.to.have.been.called
      expect(fakeAwsS3uploadFn).not.to.have.been.called

      const result = await knex.raw(`SELECT * FROM signer_credit_reports order by created_at DESC`)

      expect(result.rows[0].score).to.equal(null)
      expect(result.rows[0].document_id).to.equal(null)
      expect(result.rows[0].error_code).to.equal('generic_error')
      expect(result.rows[0].signer_id).to.equal(signerId)
    })

  })
})
