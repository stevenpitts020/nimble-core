const target = require('../../../../app/services/token/get')
const app = require('../../../../app/core')
const decode = app.plugins.jwt.decode

describe('app.services.token.get', () => {
  let options, clock

  before(() => {
    clock = sinon.useFakeTimers()
  })

  after(() => {
    clock.restore()
  })

  beforeEach(() => {
    options = {
      userId: '123',
      scopes: ['documents'],
      resources: ['documents#1'],
      expiration: 10
    }
  })

  it('should exist', () => {
    expect(target).not.to.be.undefined
  })

  describe('when options are invalid and', () => {

    it('should throw a error scopes not prensent', () => {
      options.scopes = null

      return expect(() => target(options))
        .to.throw('"scopes" must be an array')
    })

    it('should throw a error scopes are empty', () => {
      options.scopes = []

      return expect(() => target(options))
        .to.throw('"scopes" must contain at least 1 items')
    })

    it('should throw a error resources not prensent', () => {
      options.resources = null

      return expect(() => target(options))
        .to.throw('"resources" must be an array')
    })

    it('should throw a error resources are empty', () => {
      options.resources = []

      return expect(() => target(options))
        .to.throw('"resources" must contain at least 1 items')
    })

    it('should throw a error expiration is zero', () => {
      options.expiration = 0

      return expect(() => target(options))
        .to.throw('"expiration" must be a positive number')
    })

    it('should throw a error expiration is negative', () => {
      options.expiration = -1

      return expect(() => target(options))
        .to.throw('"expiration" must be a positive number')
    })
  })

  describe('when optional not present', () => {
    it('should not specify userId', () => {
      const token = target(_.omit(options, 'userId'))
      const actual = decode(token)
      expect(actual).to.have.deep.property('userId', null)
    })

    it('should apply the default scopes', () => {
      const token = target(_.omit(options, 'scopes'))
      const actual = decode(token)
      expect(actual).to.have.deep.property('scopes', ['*'])
    })

    it('should apply the default resources', () => {
      const token = target(_.omit(options, 'resources'))
      const actual = decode(token)
      expect(actual).to.have.deep.property('resources', ['*'])
    })

    it('should apply the default expiration', () => {
      const token = target(_.omit(options, 'expiration'))
      const actual = decode(token)
      expect(actual).to.have.deep.property('exp', 900)
    })
  })

  it('should return a token', () => {
    const actual = target(options)
    expect(actual).to.be.a('string')
  })

  it('should return a JWT token', () => {
    const actual = target(options)
    expect(actual.split('.')).to.have.lengthOf(3)
  })

  it('should include public claim issuer in token', () => {
    const token = target(options)
    const actual = decode(token)
    expect(actual).to.have.property('iss', 'http://localhost:8080')
  })

  it('should include public claim subject in token', () => {
    const token = target(options)
    const actual = decode(token)
    expect(actual).to.have.property('sub', 'http://localhost:8080/v1/users/123')
  })

  it('should include public claim audience in token', () => {
    const token = target(options)
    const actual = decode(token)
    expect(actual).to.have.property('aud', 'http://localhost:8080')
  })

  it('should include public claim expiration in token', () => {
    const token = target(options)
    const actual = decode(token)
    expect(actual).to.have.property('exp', 10)
  })

  it('should include public claim issued at in token', () => {
    const token = target(options)
    const actual = decode(token)
    expect(actual).to.have.property('iat', 0)
  })

  it('should include private claim resouces in token', () => {
    const token = target(options)
    const actual = decode(token)
    expect(actual).to.have.deep.property('resources', ['documents#1'])
  })

  it('should include private claim scopes in token', () => {
    const token = target(options)
    const actual = decode(token)
    expect(actual).to.have.deep.property('scopes', ['documents'])
  })

  it('should include private claim userId in token', () => {
    const token = target(options)
    const actual = decode(token)
    expect(actual).to.have.deep.property('userId', '123')
  })

  it('should not include other private claims', () => {
    const token = target(options)
    const actual = decode(token)
    expect(actual).not.to.have.deep.property('expiration', 10)
  })
})
