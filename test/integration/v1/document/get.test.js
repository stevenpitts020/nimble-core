const nock = require('nock')

describe('GET /documents/:id', () => {
  let token

  before(() => {
    nock.disableNetConnect()
    nock.enableNetConnect(/^(127\.0\.0\.1)/)
  })

  after(() => {
    nock.cleanAll()
  })

  describe('when authentication token is not present', () => {
    it('should return 401', () => {
      return request(app.server)
        .get('/v1/documents/acbde')
        .expect(401)
    })
  })

  describe('when authentication token is tampered', () => {
    beforeEach(async () => {
      token = await helpers.getExpiredAuthToken()
    })

    it('should return 401', () => {
      return request(app.server)
        .get(`/v1/documents/acbde?token=${token}`)
        .expect(401)
    })
  })

  describe('when authentication token is expired', () => {
    beforeEach(async () => {
      token = await helpers.getExpiredAuthToken()
    })

    it('should return 401', () => {
      return request(app.server)
        .get(`/v1/documents/abcde?token=${token}`)
        .expect(401)
    })
  })

  describe('when authentication token does not have valid scope', () => {
    it('should return 403 when token scope is not documents', async () => {
      const data = { scopes: ['users'] }
      token = await helpers.getScopedAuthToken(data)

      return request(app.server)
        .get(`/v1/documents/a74f9092-5889-430a-9c19-6712f9f68091?token=${token}`)
        .expect(403)
    })

    it('should return 403 when resource id not whitelisted in token', async () => {
      token = await helpers.getScopedAuthToken()

      return request(app.server)
        .get(`/v1/documents/a74f9092-5889-430a-9c19-6712f9f68091?token=${token}`)
        .expect(403)
    })
  })

  describe('when a valid request', () => {
    beforeEach(async () => {
      await seed.document.create()
      token = await helpers.getScopedAuthToken()
    })

    it('should return 401', async () => {
      const invalidtoken = await helpers.getScopedAuthToken({}, 'abcde')
      return request(app.server)
        .get(`/v1/documents/abcde?token=${invalidtoken}`)
        .expect(401)
    })

    it('should return 307', async () => {
      return request(app.server)
        .get(`/v1/documents/a74f9092-5889-430a-9c19-6712f9f68090?token=${token}`)
        .expect(307)
    })

    it('should return the new location', async () => {
      const regexp = `${app.config.get('aws').s3_endpoint}/test-uploads/a74f9092-5889-430a-9c19-6712f9f68090.png\\?\\w+`
      const expected = new RegExp(regexp, 'g')
      return request(app.server)
        .get(`/v1/documents/a74f9092-5889-430a-9c19-6712f9f68090?token=${token}`)
        .expect('Location', expected)
    })

    it('should return the aws location with presigned uri', async () => {
      const expected = /.*X-Amz-Signature=.*/g
      return request(app.server)
        .get(`/v1/documents/a74f9092-5889-430a-9c19-6712f9f68090?token=${token}`)
        .expect('Location', expected)
    })
  })
})
