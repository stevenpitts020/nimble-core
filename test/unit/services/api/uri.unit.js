const target = require('../../../../app/services/api/uri')

describe('app.services.api.uri', () => {
  it('should exist', () => {
    expect(target).not.to.be.undefined
  })

  it('should return the api uri', () => {
    const actual = target()
    expect(actual).to.be.eql('http://localhost:8080')
  })

  it('should return the api uri with path', () => {
    const actual = target('/v1/users/1')
    expect(actual).to.be.eql('http://localhost:8080/v1/users/1')
  })
})
