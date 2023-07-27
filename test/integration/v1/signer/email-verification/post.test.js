const uuid = require('uuid')
const sinon = require('sinon')

describe('POST /signers/:id/email-verifications', async () => {
  let clock

  before(async () => {
    sinon.spy(app.services.email, 'emailVerification')
    clock = sinon.useFakeTimers({
      toFake: ['Date']
    })
  })

  afterEach(() => sinon.reset())

  after(() => {
    sinon.restore()
    clock.restore()
  })

  beforeEach(async () => {
    await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
    await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
    await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')
    await seed.document.create()
    await seed.accountRequest.create('2552ab85-08da-4bb5-be00-9e94d282d348')
    await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454722')
  })


  describe('when using header Bearer token', () => {
    let headerToken
    beforeEach(async () => {
      headerToken = await helpers.getAuthToken()
    })

    describe('with invalid auth', () => {
      it('should return 401 if no auth', async () => {
        return request(app.server)
          .post('/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/email-verifications')
          .expect('Content-Type', /json/)
          .expect(401)
      })

      it('should return 401 if bad auth', async () => {
        return request(app.server)
          .post('/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/email-verifications')
          .expect('Content-Type', /json/)
          .set('Authorization', 'Bearer ' + "AAAA")
          .expect(401)
      })

      it('should return 404 if user is not in the same institution', async () => {
        await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d312')
        await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000020')
        await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d350')
        await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d350')
        const badToken = await helpers.getAuthToken('1052ab85-08da-4bb5-be00-9e94d282d350')

        return request(app.server)
          .post(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/email-verifications`)
          .set('Authorization', 'Bearer ' + badToken)
          .expect('Content-Type', /json/)
          .expect(404)
      })
    })

    it('should return 400 with invalid uuid as id', async () => {
      const id = 'invalid-uuid-here'
      return request(app.server)
        .post(`/v1/signers/${id}/email-verifications`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + headerToken)
        .expect(400)
    })

    it('should return 404 with random uuid', async () => {
      const id = uuid.v4()
      return request(app.server)
        .post(`/v1/signers/${id}/email-verifications`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + headerToken)
        .expect(404)
    })

    it('should return 204 and empty body', async () => {
      return request(app.server)
        .post(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/email-verifications`)
        .set('Authorization', 'Bearer ' + headerToken)
        .expect(204)
        .expect(response => {
          expect(response.body).to.deep.equal({})
        })
    })


    it('should reset signer email verification status', async () => {
      return request(app.server)
        .post(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/email-verifications`)
        .set('Authorization', 'Bearer ' + headerToken)
        .expect(204)
        .then(async () => {
          // fetch the signer verification status directly via signer row
          const result = await knex.raw("SELECT * FROM signers WHERE id='2e31d8c0-1226-4651-8a5d-4bd8aa454722'")
          const signer = result.rows[0]

          expect(signer.email_verified).to.equal(false)
          expect(signer.email_verified_at).to.equal(null)
        })
    })

    it('should trigger verification email service with correct ID', () => {
      return request(app.server)
        .post(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/email-verifications`)
        .set('Authorization', 'Bearer ' + headerToken)
        .expect(204)
        .then(async () => {
          // fetch the most recent email verification for this signer
          const result = await knex.raw("SELECT * FROM signer_email_verifications WHERE signer_id='2e31d8c0-1226-4651-8a5d-4bd8aa454722' ORDER BY created_at DESC LIMIT 1")
          const verification = result.rows[0]

          expect(app.services.email.emailVerification).to.have.been.calledOnce
          expect(app.services.email.emailVerification).to.have.been.calledWith(verification.id, sinon.match.any)
        })
    })

  })

  describe('when using url token', () => {
    let urlToken
    beforeEach(async () => {
      urlToken = app.services.token.get({
        scopes: ['signers'],
        resources: [`signers#2e31d8c0-1226-4651-8a5d-4bd8aa454722`],
        expiration: 86400 // 24h
      })
    })


    describe('with invalid auth', () => {
      it('should return 401 if no auth', async () => {
        return request(app.server)
          .post('/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/email-verifications')
          .expect('Content-Type', /json/)
          .expect(401)
      })

      it('should return 401 if bad auth', async () => {
        return request(app.server)
          .post('/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/email-verifications?token=bad')
          .expect('Content-Type', /json/)
          .expect(401)
      })
    })


    it('should return 401 with invalid uuid as id', async () => {
      const id = 'invalid-uuid-here'
      return request(app.server)
        .post(`/v1/signers/${id}/email-verifications?token=${urlToken}`)
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should return 403 with random uuid', async () => {
      const id = uuid.v4()
      return request(app.server)
        .post(`/v1/signers/${id}/email-verifications?token=${urlToken}`)
        .expect('Content-Type', /json/)
        .expect(403)
    })

    it('should return 204 and empty body', async () => {
      return request(app.server)
        .post(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/email-verifications?token=${urlToken}`)
        .expect(204)
        .expect(response => {
          expect(response.body).to.deep.equal({})
        })
    })

    it('should reset signer email verification status', async () => {
      return request(app.server)
        .post(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722/email-verifications?token=${urlToken}`)
        .expect(204)
        .then(async () => {
          // fetch the signer verification status directly via signer row
          const result = await knex.raw("SELECT * FROM signers WHERE id='2e31d8c0-1226-4651-8a5d-4bd8aa454722'")
          const signer = result.rows[0]

          expect(signer.email_verified).to.equal(false)
          expect(signer.email_verified_at).to.equal(null)
        })
    })

  })

})
