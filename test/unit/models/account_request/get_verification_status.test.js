const accountRequestModel = require('../../../../app/models/account_request')


const testSigners = [
  {
    "verificationStatusFace": "VALID",
    "verificationStatusDocument": "VALID",
    "verificationStatusAddress": "VALID",
    "verificationStatusSanctions": "NOMATCH",
    "verificationStatusMedia": "NOMATCH",
    "verificationStatusPoliticalExposure": "NOMATCH",
    "shouldIgnoreThisField": "NOMATCH",
  },
  {
    "verificationStatusFace": "VALID",
    "verificationStatusDocument": "INVALID",
    "verificationStatusAddress": "PENDING",
    "verificationStatusSanctions": "MATCH",
    "verificationStatusMedia": "NOMATCH",
    "verificationStatusPoliticalExposure": "NOMATCH",
    "shouldIgnoreThisField": "NOMATCH",
  },
  {
    "verificationStatusFace": "VALID",
    "verificationStatusDocument": "INVALID",
    "verificationStatusAddress": "PENDING",
    "verificationStatusSanctions": "MATCH",
    "verificationStatusMedia": "NOMATCH",
    "verificationStatusPoliticalExposure": "NOMATCH",
    "shouldIgnoreThisField": "NOMATCH",
  }
]

describe('app.models.accountRequest.getVerificationStatus', () => {
  const target = accountRequestModel.getVerificationStatus

  it('should exist', () => {
    expect(accountRequestModel.getVerificationStatus).not.to.be.undefined
    expect(accountRequestModel.getVerificationStatus).to.be.an('function')
  })

  it('should return an object with the expected schema', () => {
    const result = target(testSigners)

    expect(Object.keys(result)).to.deep.equal([
      'verificationStatusFace',
      'verificationStatusDocument',
      'verificationStatusAddress',
      'verificationStatusSanctions',
      'verificationStatusMedia',
      'verificationStatusPoliticalExposure',
    ])
  })

  it('should return an object with the expected result when provided with empty signer array', () => {
    const result = target([])

    expect(result).to.deep.equal({
      verificationStatusFace: 'PENDING',
      verificationStatusDocument: 'PENDING',
      verificationStatusAddress: 'PENDING',
      verificationStatusSanctions: 'PENDING',
      verificationStatusMedia: 'PENDING',
      verificationStatusPoliticalExposure: 'PENDING',
    })
  })

  it('should return an object with the expected result when provided with signers', () => {
    const result = target(testSigners)

    expect(result).to.deep.equal({
      verificationStatusFace: 'VALID',
      verificationStatusDocument: 'INVALID',
      verificationStatusAddress: 'PENDING',
      verificationStatusSanctions: 'MATCH',
      verificationStatusMedia: 'NOMATCH',
      verificationStatusPoliticalExposure: 'NOMATCH',
    })
  })


  it('should return an object with the expected result when provided with only one signer', () => {
    const result = target([testSigners[0]])

    expect(result).to.deep.equal({
      verificationStatusFace: 'VALID',
      verificationStatusDocument: 'VALID',
      verificationStatusAddress: 'VALID',
      verificationStatusSanctions: 'NOMATCH',
      verificationStatusMedia: 'NOMATCH',
      verificationStatusPoliticalExposure: 'NOMATCH',
    })
  })
})
