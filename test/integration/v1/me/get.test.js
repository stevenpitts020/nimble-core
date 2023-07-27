describe('GET /me', () => {
  describe('with invalid auth', () => {
    it('should return 401 if no auth', () => {
      return request(app.server)
        .get('/v1/me')
        .expect('Content-Type', /json/)
        .expect(401)
    })

    it('should return 401 if bad auth', () => {
      return request(app.server)
        .get('/v1/me')
        .expect('Content-Type', /json/)
        .set('Authorization', 'Bearer ' + "AAAA")
        .expect(401)
    })
  })

  describe('with valid auth', () => {
    let token

    beforeEach(async () => {
      await seed.institution.create('2552ab85-08da-4bb5-be00-9e94d282d311')
      await seed.institutionBranch.create('2552ab85-0000-0000-0000-000000000001')
      await seed.user.create('1052ab85-08da-4bb5-be00-9e94d282d310')
      await seed.account.create('0052ab85-08da-4bb5-be00-9e94d282d310')

      token = await helpers.getAuthToken()
    })

    describe('when token expired', () => {
      let clock

      before(async () => {
        clock = sinon.useFakeTimers({toFake: ['Date']})
      })

      after(() => {
        clock.restore()
      })

      it('should return 401', () => {
        // set timmer to front
        const ttl = app.config.get('auth').ttl
        clock.tick((ttl + 1)*1000)

        return request(app.server)
          .get('/v1/me')
          .expect('Content-Type', /json/)
          .set('Authorization', 'Bearer ' + token)
          .expect(401)
      })
    })

    it('should return 200', () => {
      return request(app.server)
        .get('/v1/me')
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
    })

    it('should return valid user object', () => {
      return request(app.server)
        .get('/v1/me')
        .set('Authorization', 'Bearer ' + token)
        .expect((res) => {
          const props = ['id', 'email', 'firstName', 'lastName', 'createdAt', 'accounts']

          props.forEach(prop => {
            expect(res.body).to.have.own.property(prop)
          })

          expect(res.body).not.to.have.own.property('updatedAt')

          expect(res.body.id).to.be.an('string')
          expect(res.body.email).to.be.an('string')
          expect(res.body.firstName).to.be.an('string')
          expect(res.body.lastName).to.be.an('string')

          expect(res.body.accounts).to.be.an('array')
          expect(res.body.accounts).to.have.lengthOf(1)
          res.body.accounts.forEach(strategy => {
            expect(strategy).not.to.have.own.property('id')
            expect(strategy).to.have.own.property('strategy')
            expect(strategy).to.have.own.property('createdAt')

            expect(strategy.strategy).to.be.an('string')
            expect(strategy.remoteId).to.be.an('null')
            expect(strategy.createdAt).to.be.an('string')
          })

          // Institution object
          expect(res.body.institution).to.be.an('object')
          expect(res.body.institution.id).to.be.an('string')
          expect(res.body.institution.name).to.be.an('string')
          expect(res.body.institution.domain).to.be.an('string')
          expect(res.body.institution.logoUri).to.be.an('object')
          expect(res.body.institution.backgroundImageUri).to.be.an('object')
        })
    })

    it('should not return secrets from accounts', () => {
      return request(app.server)
        .get('/v1/me')
        .set('Authorization', 'Bearer ' + token)
        .expect((res) => {
          expect(res.body.accounts).to.have.lengthOf(1)
          res.body.accounts.forEach(strategy => {
            expect(strategy).not.to.have.own.property('secret')
          })
        })
    })

    it('should return current user data', () => {
      const user = blueprints.me.get('1052ab85-08da-4bb5-be00-9e94d282d310')
      return request(app.server)
        .get('/v1/me')
        .set('Authorization', 'Bearer ' + token)
        .expect((res) => {
          const actual = res.body
          expect(actual).to.be.exist
          expect(actual.id).to.be.equal(user.id)
          expect(actual.email).to.be.equal(user.email)
          expect(actual.firstName).to.be.equal(user.firstName)
          expect(actual.lastName).to.be.equal(user.lastName)
          expect(actual.createdAt).to.be.equal(user.createdAt)
          expect(actual.accounts).to.have.lengthOf(1)

          // Institution object
          expect(actual.institution.id).to.eq(user.institution.id)
          expect(actual.institution.name).to.eq(user.institution.name)
          expect(actual.institution.domain).to.eq(user.institution.domain)
          expect(actual.institution.logoUri.default).to.eq(user.institution.logoUri.default)
          expect(actual.institution.backgroundImageUri.default).to.eq(user.institution.backgroundImageUri.default)

          const account = user.accounts.filter(a => a.strategy === 'local').pop()

          expect(account).not.to.be.undefined
          expect(account.secret).to.be.undefined
          expect(account.createdAt).to.equal('2018-02-16T12:32:03.341Z')
        })
      })
  })
})
