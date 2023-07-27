const target = require('../../../app/serializers/v1/account_request.xml')
const fs = require('fs')
const path = require('path')


describe('app.serializers.accountRequestXml', () => {
  it('should exist', () => {
    expect(target).not.to.be.undefined
  })

  it('should be a function', () => {
    expect(target).to.be.an('Function')
  })

  it('should return string', () => {
    const result = target(blueprints.account_requests.account_request_4)
    expect(result).to.be.an('string')
  })

  it('should parse an account request', () => {
    const result = target(blueprints.account_requests.account_request_4)
    // note: please edit this file with a editor that doesn't add a newline at the end or you will get an error with this test
    const mockAccountRequestXml = fs.readFileSync(path.resolve(__dirname, '../../support/mock/xml/account_request.xml')).toString()
    expect(result).to.equal(mockAccountRequestXml)
  })

  it('should parse an account request with signers with id proof PASSPORT', () => {
    const result = target(blueprints.account_requests.account_request_5)
    // note: please edit this file with a editor that doesn't add a newline at the end or you will get an error with this test
    const mockAccountRequestXml = fs.readFileSync(path.resolve(__dirname, '../../support/mock/xml/account_request_passport.xml')).toString()
    expect(result).to.equal(mockAccountRequestXml)
  })
})
