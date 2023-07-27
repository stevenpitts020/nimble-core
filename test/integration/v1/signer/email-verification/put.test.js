const uuid = require('uuid')

describe('PUT /signers/:id/email-verifications/:verification-id', async () => {
  let tokenValid, tokenExpired, tokenConsumed

  before(async () => {
    tokenValid = app.services.token.get({
      scopes: ['signers.email_verifications'],
      resources: [`signers.email_verifications#2e31d8c0-1226-4651-8a5d-4bd8aa454721`],
      expiration: 86400 // 24h
    })

    tokenExpired = app.services.token.get({
      scopes: ['signers.email_verifications'],
      resources: [`signers.email_verifications#2e31d8c0-1226-4651-8a5d-4bd8aa454721`],
      expiration: 86400 // 24h
    })

    tokenConsumed = app.services.token.get({
      scopes: ['signers.email_verifications'],
      resources: [`signers.email_verifications#2e31d8c0-1226-4651-8a5d-4bd8aa454721`],
      expiration: 86400 // 24h
    })
  })

  beforeEach(async () => {
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.document.create()
    await seed.accountRequest.create('2552ab85-08da-4bb5-be00-9e94d282d348')
    await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454721')
    await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722') // only used to check 403 error
    await seed.signerEmailVerification.create('FF000000-0000-0000-1111-4bd8aa454721') // valid
    await seed.signerEmailVerification.create('FF000000-0000-0000-2222-4bd8aa454721') // expired
    await seed.signerEmailVerification.create('FF000000-0000-0000-3333-4bd8aa454721') // consumend
  })


  describe('with invalid data', () => {

    it('should return 400 with invalid uuid as id', async () => {
      const signerId = "2e31d8c0-1226-4651-8a5d-4bd8aa454721"
      const verificationId = 'invalid-uuid-here'

      return request(app.server)
        .put(`/v1/signers/${signerId}/email-verifications/${verificationId}?token=${tokenValid}`)
        .expect('Content-Type', /json/)
        .expect(400)
    })

    it('should return 401 with invalid uuid as signer id', async () => {
      const signerId = 'invalid-uuid-here'
      const verificationId = 'FF000000-0000-0000-1111-4bd8aa454721'
      return request(app.server)
        .put(`/v1/signers/${signerId}/email-verifications/${verificationId}?token=${tokenValid}`)
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should return 404 with random verification id', async () => {
      const signerId = "2e31d8c0-1226-4651-8a5d-4bd8aa454721"
      const verificationId = uuid.v4()

      const randomToken = app.services.token.get({
        scopes: ['signers.email_verifications'],
        resources: [`signers.email_verifications#${signerId}`],
        expiration: 86400 // 24h
      })

      return request(app.server)
        .put(`/v1/signers/${signerId}/email-verifications/${verificationId}?token=${randomToken}`)
        .expect('Content-Type', /json/)
        .expect(404)
    })

    it('should return 403 with random signer id', async () => {
      const signerId = uuid.v4()
      const verificationId = 'FF000000-0000-0000-1111-4bd8aa454721'

      return request(app.server)
        .put(`/v1/signers/${signerId}/email-verifications/${verificationId}?token=${tokenValid}`)
        .expect('Content-Type', /json/)
        .expect(403)
    })


    it('should return 412 with expired token', async () => {
      const signerId = "2e31d8c0-1226-4651-8a5d-4bd8aa454721"
      const verificationId = 'FF000000-0000-0000-2222-4bd8aa454721'
      return request(app.server)
        .put(`/v1/signers/${signerId}/email-verifications/${verificationId}?token=${tokenExpired}`)
        .expect('Content-Type', /json/)
        .expect(412)
    })


    it('should return 409 with consumend token', async () => {
      const signerId = "2e31d8c0-1226-4651-8a5d-4bd8aa454721"
      const verificationId = 'FF000000-0000-0000-3333-4bd8aa454721'
      return request(app.server)
        .put(`/v1/signers/${signerId}/email-verifications/${verificationId}?token=${tokenConsumed}`)
        .expect('Content-Type', /json/)
        .expect(409)
    })

    it('should return 403 when signer does not match', async () => {
      const signerId = "2e31d8c0-1226-4651-8a5d-4bd8aa454722"
      const verificationId = 'FF000000-0000-0000-1111-4bd8aa454721'
      return request(app.server)
        .put(`/v1/signers/${signerId}/email-verifications/${verificationId}?token=${tokenValid}`)
        .expect('Content-Type', /json/)
        .expect(403)
    })

  })

  it('should return 204 and empty body', async () => {
    const signerId = "2e31d8c0-1226-4651-8a5d-4bd8aa454721"
    const verificationId = 'FF000000-0000-0000-1111-4bd8aa454721'
    return request(app.server)
      .put(`/v1/signers/${signerId}/email-verifications/${verificationId}?token=${tokenValid}`)
      .expect(204)
      .expect(response => {
        expect(response.body).to.deep.equal({})
      })
  })


  it('should return 204 using global "signers" scoped token', () => {
    const signerId = "2e31d8c0-1226-4651-8a5d-4bd8aa454721"
    const verificationId = 'FF000000-0000-0000-1111-4bd8aa454721'

    const globalToken = app.services.token.get({
      scopes: ['signers', 'documents'],
      resources: [`signers#2e31d8c0-1226-4651-8a5d-4bd8aa454721`, 'document#123'],
      expiration: 86400 // 24h
    })

    return request(app.server)
      .put(`/v1/signers/${signerId}/email-verifications/${verificationId}?token=${globalToken}`)
      .expect(204)
  })

})
