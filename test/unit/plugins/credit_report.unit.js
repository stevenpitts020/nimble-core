const axios = require('axios')
const nock = require('nock')
const fs = require('fs')

const mocks = require('../../support/mock/credit_report')
const creditReport = require('../../../app/plugins/credit_report')

axios.defaults.adapter = require('axios/lib/adapters/http')

describe('Credit Report Plugin', () => {

  beforeEach(() => {
    nock.disableNetConnect()
    nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/)
  })

  afterEach(() => { nock.cleanAll() })

  describe('_cleanReportHTML', () => {
    it('should return clean html', async () => {

      const input = fs.readFileSync('./test/support/mock/html2pdf/report.html', 'utf8')
      const result = await creditReport._cleanReportHTML(input.toString())
      // problem: could not compare directly
      expect(result.indexOf('<script>')).to.equal(-1)
      expect(result.indexOf('<link>')).to.equal(-1)
      expect(result.indexOf('<style>')).to.equal(165)
      expect(result.indexOf('<html>')).to.equal(15)
      expect(result.indexOf('</html>')).to.equal(14081)
    })
    it('should return valid empty string if arg is null', async () => {
      const result = await creditReport._cleanReportHTML(null)
      expect(result).to.deep.equal('')
    })
  })

  describe('_removeTagsHTML', () => {
    it('should return valid html', async () => {
      const input=`<style><html><div>ok</div><script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script><link type="text/css" rel="stylesheet" media="print" href="/templates/pushbutton/css/print_report.css" /><script src="/preq/js/preq.js"></script></html>`

      const output='<style><html><div>ok</div></html>'

      const result = await creditReport._removeTagsHTML(input)
      expect(result).to.deep.equal(output)
    })
    it('should return valid empty string if arg is null', async () => {
      const result = await creditReport._removeTagsHTML(null)
      expect(result).to.deep.equal('')
    })
  })

  describe('_injectPrintCSS', () => {
    it('should return valid html with printcss', async () => {
      const input='<style></style>hola'
      const output='<style>\n    body,html{font-family:Helvetica,Arial,sans-serif}#col_2_menu,#creditnav,#footer,#headerspacing,.adminreturndiv,.fa-question-circle,header{display:none!important}#tab_0,#tab_1,#tab_2,#tab_3,#tab_4,#tab_5,#tab_6,#tab_7{display:block!important}#col_2_content{padding-top:0!important}.accounttrader{overflow:hidden;display:inline-block}.hideonprint{display:none}.showonprint{display:inline-block!important}</style>hola'

      const result = await creditReport._injectPrintCSS(input)
      expect(result).to.equal(output)
    })
    it('should return valid empty string if arg is null', async () => {
      const result = await creditReport._injectPrintCSS(null)
      expect(result).to.deep.equal('')
    })
  })

  describe('_injectValidHead', () => {
    it('should return valid html head', async () => {
      const input='<div class="fpn_clientarea_bg">hola</div><!-- end clientarea bg -->'
      const output='<html><head><meta http-equiv="Content-type" content="text/html; charset=utf-8" /><meta charset="UTF-8" /></head><body><div class="fpn_clientarea_bg">hola</div><!-- end clientarea bg --></body></html>'

      const result = await creditReport._injectValidHead(input)
      expect(result).to.equal(output)
    })
    it('should return valid empty string if arg is null', async () => {
      const result = await creditReport._injectValidHead(null)
      expect(result).to.deep.equal('')
    })
  })

  describe('_getDate', () => {
    it('should return iso date', async () => {
      const result = await creditReport._getDate('1603884611')
      expect(result).to.deep.equal('2020-10-28T11:30:11.000Z')
    })
  })

  describe('_convertDOB', () => {
    it('should return date in MMDDYYYY', async () => {
      const result = await creditReport._convertDOB(new Date("1982-12-06"))
      expect(result).to.deep.equal('12061982')
    })
    it('should return date string in MMDDYYYY', async () => {
      const result = await creditReport._convertDOB('1982-12-06')
      expect(result).to.deep.equal('12061982')
    })
    it('should return if null arg', async () => {
      const result = await creditReport._convertDOB(null)
      expect(result).to.deep.equal('')
    })
    it('should return if date is invalid arg', async () => {
      const result = await creditReport._convertDOB('1982')
      expect(result).to.deep.equal('')
    })
    it('should return if blank arg', async () => {
      const result = await creditReport._convertDOB('')
      expect(result).to.deep.equal('')
    })
  })

  describe('_getScore', () => {
    it('should return 0 if 004', async () => {
      const result = await creditReport._getScore('0004')
      expect(result).to.deep.equal(0)
    })
    it('should return 0 if empty string', async () => {
      const result = await creditReport._getScore('')
      expect(result).to.deep.equal(0)
    })
    it('should return number if it starts with 0', async () => {
      const result = await creditReport._getScore('0748')
      expect(result).to.deep.equal(748)
    })
    it('should return number', async () => {
      const result = await creditReport._getScore('1845')
      expect(result).to.deep.equal(1845)
    })
    it('should return null if null', async () => {
      const result = await creditReport._getScore(null)
      expect(result).to.deep.equal(null)
    })
    it('should return null if undefined', async () => {
      const result = await creditReport._getScore()
      expect(result).to.deep.equal(null)
    })
  })

  describe('_formatApplicantData', () => {
    it('should process a valid signer', async () => {
      const signer = {
        'firstName': 'ADRIENNE',
        'lastName': 'BRAKE',
        'address': '523 W ALAMAR AVE',
        'city': 'GREENFIELD',
        'state': 'CA',
        'zipCode': '931054826',
        'ssn': '666-70-7610',
        'phoneNumber': '(233) 555-3333',
        'dateOfBirth': '1945-12-06',
        'email': 'psousa+test@wearesingular.com'
      }
      const result = await creditReport._formatApplicantData(signer)
      expect(result).to.deep.equal(mocks.validApplicant)
    })

    it('should add middlename', async () => {
      const signer = {
        id: "2e31d8c0-1226-4651-8a5d-4bd8aa454722",
        firstName: "George",
        middleName: "M",
        lastName: "Constanza",
        email: 'psousa+1@wearesingular.com',
        address: '123 main street apt. 1',
        city: 'Lisbon',
        state: 'CA',
        zipCode: '22222',
        ssn: '333-33-3333',
        phoneNumber: '(233) 555-3333',
        dateOfBirth: '1982-12-06',
        documentNumber: '123213',
        documentExpirationDate: '2021-12-12',
        documentIssuedDate: '2019-12-12',
        employer: "Singular",
      }
      const result = {
        'firstname': "George",
        'middlename': "M",
        'lastname': "Constanza",
        'address1': '123 main street apt. 1',
        'city': 'Lisbon',
        'state': 'CA',
        'postcode': '22222',
        'phone': '2335553333',
        'email': 'psousa+1@wearesingular.com',
        'ssn': '333333333',
        'dob': '12061982'
      }

      const response = await creditReport._formatApplicantData(signer)
      expect(response).to.deep.equal(result)
    })
  })

  // this makes actual api call
  describe('processApplicant', () => {
    it('should return valid response', async () => {
      const response = mocks.processApplicantSuccess
      const scope = nock(creditReport._apiURL())
        .post(/process_applicant/)
        .reply(200, response)

      const result = await creditReport.processApplicant(mocks.signer)

      expect(result).to.have.deep.property('prequal', response.prequal)
      scope.done()
    })

    it('should return error when signer is null', async () => {
      try {
        await creditReport.processApplicant({})
      } catch (error) {
        expect(error.message).to.equal("Signer is empty")
        expect(error).to.be.an.instanceof(Error)
      }
    })

    it('should return error when signer is incomplete', async () => {
      const signer = {
        'firstName': 'ADRIENNE',
        'lastName': null,
        'address': '523 W ALAMAR AVE',
        'city': 'GREENFIELD',
        'dateOfBirth': '1945-01-01',
        'ssn': '333-33-3333'
      }
      try {
        await creditReport.processApplicant(signer)
      } catch (error) {
        expect(error).to.be.an.instanceof(Error)
        expect(error.message).to.equal('The minimal required parameters for this endpoint were not met. "lastname" must be a string."state" is required."postcode" is required."phone" is not allowed to be empty."email" is required')
      }
    })
  })

  describe('fetchReport', () => {
    it('should return valid response', async () => {
      const response = mocks.resultsSuccess
      const scope = nock(creditReport._apiURL('prequal_results'))
        .post(/prequal_results/)
        .reply(200, response)

      const result = await creditReport.fetchReport('227031')

      expect(result).to.deep.equal(response)
      scope.done()
    })

    it('should return error when signer is null', async () => {
      try {
        await creditReport.fetchReport(null)
      } catch (error) {
        expect(error.message).to.equal("Missing reference")
        expect(error).to.be.an.instanceof(Error)
      }
    })

    it('should return error when signer is ""', async () => {
      try {
        await creditReport.fetchReport("")
      } catch (error) {
        expect(error.message).to.equal("Missing reference")
        expect(error).to.be.an.instanceof(Error)
      }
    })

    it('should return error when signer is undefined', async () => {
      try {
        await creditReport.fetchReport(undefined)
      } catch (error) {
        expect(error.message).to.equal("Missing reference")
        expect(error).to.be.an.instanceof(Error)
      }
    })

  })
})
