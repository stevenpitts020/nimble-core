const { uuid } = require('uuidv4')

describe('GET /signers/:id', async () => {
  let clock

  before(async () => {
    clock = sinon.useFakeTimers({
      toFake: ['Date']
    })
  })

  after(() => {
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
    await seed.signer.create('2e31d8c0-1226-4651-8a5d-4bd8aa454721')
  })

  describe('Token', () => {
    function getToken(signerId) {
      return app.services.token.get({
        scopes: ['signers'],
        resources: [`signers#${signerId}`],
        expiration: 10
      })
    }

    describe('when validating token', () => {
      it('should complain about missing auth', async () => {
        return request(app.server)
          .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722`)
          .expect('Content-Type', /json/)
          .send({})
          .expect(401)
      })

      it('should complain if auth token is invalid', async () => {
        return request(app.server)
          .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722`)
          .set('Authorization', 'Bearer ' + 'AAAA')
          .send({})
          .expect('Content-Type', /json/)
          .expect(401)
      })

      it('should complain if auth token is from the wrong signer', async () => {
        const token = getToken('00000000-0000-0000-0000-4bd8aa454722')

        return request(app.server)
          .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722`)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(403)
      })
    })

    describe('when validating', () => {
      it('should 404 if signer does not exist', async () => {
        const signerId = uuid()
        const token = getToken(signerId)

        return request(app.server)
          .get(`/v1/signers/${signerId}`)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(404)
      })
    })

    describe('when calling with valid data', () => {
      it('should return 200', () => {
        const signerId = '2e31d8c0-1226-4651-8a5d-4bd8aa454722'
        const token = getToken(signerId)

        return request(app.server)
          .get(`/v1/signers/${signerId}`)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
      })

      it('should fetch a signer with the right schema', async () => {
        const signerId = '2e31d8c0-1226-4651-8a5d-4bd8aa454722'
        const token = getToken(signerId)

        return request(app.server)
          .get(`/v1/signers/${signerId}`)
          .set('Authorization', 'Bearer ' + token)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            expect(res.body).to.deep.equal(blueprints.signers.signer_1)
          })
      })
    })
  })

  describe('AuthToken', () => {
    let token
    beforeEach(async () => {
      token = await helpers.getAuthToken()
    })

    describe('with invalid auth', () => {
      it('should return 401 if no auth', async () => {
        return request(app.server)
          .get('/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722')
          .expect('Content-Type', /json/)
          .expect(401)
      })

      it('should return 401 if bad auth', async () => {
        return request(app.server)
          .get('/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722')
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
          .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722`)
          .expect('Content-Type', /json/)
          .set('Authorization', 'Bearer ' + badToken)
          .expect(404)
      })
    })

    it('should return 400 with invalid uuid as id', async () => {
      const id = 'invalid-uuid-here'
      return request(app.server)
        .get(`/v1/signers/${id}`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(400)
    })

    it('should return 404 with random uuid', async () => {
      const id = uuid()
      return request(app.server)
        .get(`/v1/signers/${id}`)
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + token)
        .expect(404)
    })

    describe('when calling with valid data', () => {
      it('should return 200', () => {
        return request(app.server)
          .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722`)
          .expect('Content-Type', /json/)
          .set('Authorization', 'Bearer ' + token)
          .expect(response => {
            expect(response.body).to.deep.equal(blueprints.signers.signer_1)
          })
      })

      it('should fetch a signer with the right schema', async () => {
        return request(app.server)
          .get(`/v1/signers/2e31d8c0-1226-4651-8a5d-4bd8aa454722`)
          .expect('Content-Type', /json/)
          .set('Authorization', 'Bearer ' + token)
          .expect(response => {
            expect(response.body).to.deep.equal(blueprints.signers.signer_1)
          })
      })
    })
  })
})
