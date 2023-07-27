
const sinon = require('sinon')
const axios = require('axios')
const nock = require('nock')
const fs = require('fs')
const { successResponse, errorResponse } = require('../../../support/mock/html2pdf/response')
const creditReportPlugin = require('../../../../app/plugins/credit_report')

axios.defaults.adapter = require('axios/lib/adapters/http')

describe('app.services.creditReport.export', () => {
  afterEach(() => { nock.cleanAll() })

  beforeEach(async () => {
    nock.disableNetConnect()
    nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)

    await seed.institution.create()
  })

  describe('when calling with valid data', () => {
    afterEach(() => sinon.restore())

    it('should exist', () => {
      expect(app.services.creditReport.export).not.to.be.undefined
    })

    it('should create a document with a valid PDF', async () => {
      const url = 'http://wearesingular.com/404.html'
      const institutionId = '2552ab85-08da-4bb5-be00-9e94d282d311'

      const html = fs.readFileSync('./test/support/mock/html2pdf/report.html', 'utf8')
      const fakeResponseDownload = sinon.fake.returns({ data: Buffer.from(html) })
      sinon.replace(creditReportPlugin, '_downloadReport', fakeResponseDownload)

      const fakeAwsS3uploadFn = sinon.fake.returns(Promise.resolve(true))
      sinon.replace(app.plugins.aws, 's3Upload', fakeAwsS3uploadFn)

      const fakeAwsLambda = sinon.fake.returns(successResponse)
      sinon.replace(app.plugins.aws, 'invokeLambda', fakeAwsLambda)

      const document = await app.services.creditReport.export(url, institutionId)

      expect(fakeResponseDownload).to.have.been.calledWith(url)
      expect(fakeAwsS3uploadFn).to.have.been.calledOnce
      expect(fakeAwsLambda).to.have.been.calledOnce
      expect(document.format).to.equal('pdf')
    })

    it('return a error when lambda could not process HTML', async () => {
      const url = 'http://wearesingular.com/404.html'
      const institutionId = '2552ab85-08da-4bb5-be00-9e94d282d311'

      const html = fs.readFileSync('./test/support/mock/html2pdf/report-bad.html', 'utf8')
      const fakeResponseDownload = sinon.fake.returns({ data: Buffer.from(html) })
      sinon.replace(creditReportPlugin, '_downloadReport', fakeResponseDownload)

      const fakeAwsLambda = sinon.fake.returns(errorResponse)
      sinon.replace(app.plugins.aws, 'invokeLambda', fakeAwsLambda)

      try {
        await app.services.creditReport.export(url, institutionId)
      } catch (error) {
        expect(fakeResponseDownload).to.have.been.calledWith(url)
        expect(fakeAwsLambda).to.have.been.calledOnce
        expect(error.message).to.equal("Error: [__export] could not transform pdf http://wearesingular.com/404.html")
        expect(error).to.be.an.instanceof(Error)
      }
    })

    it('return a error if download has expired or malformed ', async () => {
      const url = 'doesnotmather'
      const institutionId = '2552ab85-08da-4bb5-be00-9e94d282d311'

      const fakeResponseDownload = sinon.fake.returns({ data: 'coco' })
      const fakeAwsS3uploadFn = sinon.fake.returns(Promise.resolve(true))
      sinon.replace(creditReportPlugin, '_downloadReport', fakeResponseDownload)
      sinon.replace(app.plugins.aws, 's3Upload', fakeAwsS3uploadFn)

      try {
        await app.services.creditReport.export(url, institutionId)
      } catch (error) {
        expect(error.message).to.equal("Error: creditReport.export() Could not fetch report for doesnotmather")
        expect(error).to.be.an.instanceof(Error)
      }
    })

    it('return a error if could not connect to url', async () => {
      const url = 'http://www.doesnotmather.com/cenas'
      const institutionId = '2552ab85-08da-4bb5-be00-9e94d282d311'

      nock('http://www.doesnotmather.com')
        .get(/cenas/)
        .reply(400, {})

      try {
        await app.services.creditReport.export(url, institutionId)
      } catch (error) {
        expect(error.message).to.equal("Error: Request failed with status code 400")
        expect(error).to.be.an.instanceof(Error)
      }
    })
  })
})
